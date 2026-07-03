// Single dispatcher for the PublishingService. Consumes queued events
// from public.publishing_events and delegates to every active ChannelAdapter.
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
  await supabase
    .from("publishing_events")
    .update({ status: "processing" })
    .eq("id", event.id);

  const { data: channelRows } = await supabase
    .from("publishing_channels")
    .select("key, enabled, config");

  const enabledMap = new Map<string, Record<string, unknown>>(
    (channelRows ?? [])
      .filter((c: any) => c.enabled)
      .map((c: any) => [c.key, c.config ?? {}]),
  );

  const product = await loadProduct(supabase, event.product_id);
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

  // Persist logs
  if (results.length > 0) {
    await supabase.from("publishing_logs").insert(
      results.map((r) => ({
        event_id: event.id,
        channel_key: r.channel,
        status: r.result.status,
        request: r.result.request ?? {},
        response: r.result.response ?? {},
        error: r.result.error ?? null,
        attempts: 1,
      })),
    );
  }

  const anyFailed = results.some((r) => r.result.status === "failed");
  await supabase
    .from("publishing_events")
    .update({
      status: anyFailed ? "failed" : "completed",
      processed_at: new Date().toISOString(),
    })
    .eq("id", event.id);

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
      const { data } = await supabase
        .from("publishing_events")
        .select("*")
        .eq("id", eventId)
        .limit(1);
      events = (data ?? []) as PublishingEvent[];
    } else {
      const { data } = await supabase
        .from("publishing_events")
        .select("*")
        .in("status", ["pending", "failed"])
        .order("created_at", { ascending: true })
        .limit(20);
      events = (data ?? []) as PublishingEvent[];
    }

    const processed: Record<string, unknown>[] = [];
    for (const e of events) {
      const results = await processEvent(supabase, e);
      processed.push({ event_id: e.id, results });
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