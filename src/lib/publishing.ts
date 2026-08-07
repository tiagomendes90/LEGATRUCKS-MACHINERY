import { supabase } from "@/admin/supabaseClient";

export type PublishingEventType =
  | "product.published"
  | "product.updated"
  | "product.unpublished"
  | "social.publish.confirmed"
  | "social.republish"
  | "social.story.publish"
  | "social.reel.publish"
  | "social.delete"
  | "newsletter.instant"
  | "digest.weekly"
  | "newsletter.campaign.send"
  | "newsletter.campaign.cancel";

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
export class PublishingEnqueueError extends Error {
  code?: string;
  details?: string;
  hint?: string;
  constructor(error: any) {
    const code = error?.code ? ` (${error.code})` : "";
    super(
      `Falha ao enfileirar evento de publicação${code}: ${
        error?.message ?? "erro desconhecido"
      }${error?.details ? ` — ${error.details}` : ""}${error?.hint ? ` — ${error.hint}` : ""}`,
    );
    this.name = "PublishingEnqueueError";
    this.code = error?.code;
    this.details = error?.details;
    this.hint = error?.hint;
  }
}

export async function emitPublishingEvent({
  type,
  productId = null,
  payload = {},
  dedupeKey = null,
  scheduledFor = null,
}: EmitEventInput) {
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
      console.error("[publishing] failed to enqueue event", error);
      throw new PublishingEnqueueError(
        error ?? {
          code: "NO_ROW",
          message:
            "O insert não devolveu nenhuma linha (possível bloqueio de leitura por RLS).",
        },
      );
    }

    // Trigger dispatcher asynchronously; ignore errors so publish never blocks.
    if (!scheduledFor) {
      supabase.functions
        .invoke("publish-dispatcher", { body: { event_id: data.id } })
        .catch((err) => console.warn("[publishing] dispatcher invoke failed", err));
    }

    return { ok: true, eventId: data.id };
}

/**
 * Variante tolerante: usar apenas em fluxos onde a falha do pipeline
 * NÃO deve bloquear a operação principal (ex.: guardar produto no site).
 */
export async function tryEmitPublishingEvent(input: EmitEventInput) {
  try {
    return await emitPublishingEvent(input);
  } catch (err) {
    console.warn("[publishing] evento não enfileirado", err);
    return { ok: false as const, error: err };
  }
}