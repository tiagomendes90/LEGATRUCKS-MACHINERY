// Single dispatcher for the PublishingService. Consumes queued events
// from public.publishing_events and delegates to every active ChannelAdapter.
// Fase 2.0: lock atómico via claim_publishing_events(), retries exponenciais,
// e isolamento total — nenhuma falha aqui pode afetar o website ou a BD.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { channels } from "../_shared/publishing/channels/index.ts";
import type {
  ChannelResult,
  PublishingContext,
  PublishingEvent,
} from "../_shared/publishing/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAX_ATTEMPTS = 6;
const WORKER_ID = `dispatcher-${crypto.randomUUID().slice(0, 8)}`;

// Backoff exponencial: 1min, 5min, 15min, 1h, 6h, 24h
function nextBackoffMs(attempts: number): number {
  const steps = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 6 * 3600_000, 24 * 3600_000];
  return steps[Math.min(attempts - 1, steps.length - 1)];
}

async function loadProduct(supabase: any, productId: string | null) {
  if (!productId) return null;
  const { data } = await supabase
    .from("products")
    .select("*, brand:brands(name, slug), images:product_images(image_url, is_primary, sort_order)")
    .eq("id", productId)
    .maybeSingle();
  return data ?? null;
}

async function processEvent(supabase: any, event: PublishingEvent) {
  const { data: channelRows } = await supabase
    .from("publishing_channels")
    .select("key, enabled, config");

  const enabledMap = new Map<string, Record<string, unknown>>(
    (channelRows ?? [])
      .filter((c: any) => c.enabled)
      .map((c: any) => [c.key, c.config ?? {}]),
  );

  let product: Record<string, unknown> | null = null;
  try {
    product = await loadProduct(supabase, event.product_id);
  } catch (err) {
    console.warn("[dispatcher] loadProduct failed", err);
  }
  const results: Array<{ channel: string; result: ChannelResult }> = [];

  for (const adapter of channels) {
    const channelConfig = enabledMap.get(adapter.key);
    if (!channelConfig) {
      results.push({
        channel: adapter.key,
        result: { status: "skipped", response: { reason: "channel disabled" } },
      });
      continue;
    }
    if (!adapter.supports(event)) {
      results.push({
        channel: adapter.key,
        result: { status: "skipped", response: { reason: "event not supported" } },
      });
      continue;
    }

    const ctx: PublishingContext = {
      event,
      product,
      channelConfig,
      supabaseUrl: SUPABASE_URL,
      serviceRoleKey: SERVICE_ROLE_KEY,
    };

    let result: ChannelResult;
    try {
      result = await adapter.publish(ctx);
    } catch (err) {
      result = { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }

    results.push({ channel: adapter.key, result });
  }

  // Persist logs (best-effort; nunca deve falhar o processamento)
  if (results.length > 0) {
    try {
      await supabase.from("publishing_logs").insert(
        results.map((r) => ({
          event_id: event.id,
          channel_key: r.channel,
          status: r.result.status,
          request: r.result.request ?? {},
          response: r.result.response ?? {},
          error: r.result.error ?? null,
          attempts: event.attempts ?? 1,
        })),
      );
    } catch (err) {
      console.warn("[dispatcher] failed to persist logs", err);
    }
  }

  const anyFailed = results.some((r) => r.result.status === "failed");
  const attempts = event.attempts ?? 1;

  if (anyFailed && attempts < MAX_ATTEMPTS) {
    // Reagendar com backoff exponencial — permanece elegível para retry.
    const nextAt = new Date(Date.now() + nextBackoffMs(attempts)).toISOString();
    await supabase
      .from("publishing_events")
      .update({
        status: "failed",
        next_attempt_at: nextAt,
        locked_at: null,
        locked_by: null,
        last_error: results.find((r) => r.result.status === "failed")?.result.error ?? null,
      })
      .eq("id", event.id);
  } else {
    await supabase
      .from("publishing_events")
      .update({
        status: anyFailed ? "failed" : "completed",
        processed_at: new Date().toISOString(),
        next_attempt_at: null,
        locked_at: null,
        locked_by: null,
        last_error: anyFailed
          ? results.find((r) => r.result.status === "failed")?.result.error ?? "max attempts reached"
          : null,
      })
      .eq("id", event.id);
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const eventId: string | undefined = body?.event_id;

    let events: PublishingEvent[] = [];
    if (eventId) {
      // Chamada direta (ex.: pós-emit) — força claim deste evento específico.
      const { data: row } = await supabase
        .from("publishing_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (row && ["pending", "scheduled", "failed"].includes(row.status)) {
        const { data: updated } = await supabase
          .from("publishing_events")
          .update({
            status: "processing",
            locked_at: new Date().toISOString(),
            locked_by: WORKER_ID,
            attempts: (row.attempts ?? 0) + 1,
          })
          .eq("id", eventId)
          .in("status", ["pending", "scheduled", "failed"])
          .select("*")
          .maybeSingle();
        if (updated) events = [updated as PublishingEvent];
      }
    } else {
      // Cron / batch — usa lock atómico SKIP LOCKED via RPC.
      const { data, error } = await supabase.rpc("claim_publishing_events", {
        p_limit: 20,
        p_worker: WORKER_ID,
      });
      if (error) {
        console.error("[dispatcher] claim_publishing_events failed", error);
      }
      events = (data ?? []) as PublishingEvent[];
    }

    const processed: Record<string, unknown>[] = [];
    for (const e of events) {
      try {
        const results = await processEvent(supabase, e);
        processed.push({ event_id: e.id, results });
      } catch (err) {
        // Nunca propagar — regista e continua.
        console.error(`[dispatcher] event ${e.id} threw`, err);
        await supabase
          .from("publishing_events")
          .update({
            status: "failed",
            locked_at: null,
            locked_by: null,
            last_error: err instanceof Error ? err.message : String(err),
          })
          .eq("id", e.id);
        processed.push({ event_id: e.id, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});