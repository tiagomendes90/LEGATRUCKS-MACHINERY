import { supabase } from "@/admin/supabaseClient";

export type PublishingEventType =
  | "product.published"
  | "product.updated"
  | "product.unpublished"
  | "social.publish.confirmed"
  | "social.republish"
  | "social.delete"
  | "newsletter.instant"
  | "digest.weekly";

export interface EmitEventInput {
  type: PublishingEventType;
  productId?: string | null;
  payload?: Record<string, unknown>;
  /** Impede duplicados: mesmo (type, productId, dedupeKey) só entra 1x. */
  dedupeKey?: string | null;
  /** ISO string — se preenchido, o evento fica `scheduled` até essa data. */
  scheduledFor?: string | null;
}

/**
 * Emit a publishing event. Enqueues in publishing_events and then triggers
 * the publish-dispatcher edge function (fire-and-forget — UI is never blocked).
 * Uma falha aqui NUNCA bloqueia a publicação do produto no website —
 * a fonte oficial é a BD e o pipeline é um consumidor independente.
 */
export async function emitPublishingEvent({
  type,
  productId = null,
  payload = {},
  dedupeKey = null,
  scheduledFor = null,
}: EmitEventInput) {
  try {
    const row: Record<string, unknown> = {
      event_type: type,
      product_id: productId ?? undefined,
      payload: payload as any,
      status: scheduledFor ? "scheduled" : "pending",
    };
    if (dedupeKey) row.dedupe_key = dedupeKey;
    if (scheduledFor) row.scheduled_for = scheduledFor;

    const { data, error } = await supabase
      .from("publishing_events")
      .insert([row as any])
      .select("id")
      .maybeSingle();

    if (error || !data) {
      // Dedupe conflict (23505) é resultado esperado: já existe evento equivalente.
      if ((error as any)?.code === "23505") {
        return { ok: true, deduped: true };
      }
      console.warn("[publishing] failed to enqueue event", error);
      return { ok: false, error };
    }

    // Trigger dispatcher asynchronously; ignore errors so publish never blocks.
    if (!scheduledFor) {
      supabase.functions
        .invoke("publish-dispatcher", { body: { event_id: data.id } })
        .catch((err) => console.warn("[publishing] dispatcher invoke failed", err));
    }

    return { ok: true, eventId: data.id };
  } catch (err) {
    console.warn("[publishing] unexpected error emitting event", err);
    return { ok: false, error: err };
  }
}