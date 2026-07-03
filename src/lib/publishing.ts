import { supabase } from "@/admin/supabaseClient";

export type PublishingEventType =
  | "product.published"
  | "product.updated"
  | "product.unpublished";

export interface EmitEventInput {
  type: PublishingEventType;
  productId?: string | null;
  payload?: Record<string, unknown>;
}

/**
 * Emit a publishing event. Enqueues in publishing_events and then triggers
 * the publish-dispatcher edge function (fire-and-forget — UI is never blocked).
 * Adding a new channel does NOT require any change here.
 */
export async function emitPublishingEvent({ type, productId = null, payload = {} }: EmitEventInput) {
  const { data, error } = await supabase
    .from("publishing_events")
    .insert({ event_type: type, product_id: productId, payload })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.warn("[publishing] failed to enqueue event", error);
    return { ok: false, error };
  }

  // Trigger dispatcher asynchronously; ignore errors so publish never blocks.
  supabase.functions
    .invoke("publish-dispatcher", { body: { event_id: data.id } })
    .catch((err) => console.warn("[publishing] dispatcher invoke failed", err));

  return { ok: true, eventId: data.id };
}