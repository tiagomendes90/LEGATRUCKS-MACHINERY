import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";
import { renderNewsletterHtml } from "../newsletterTemplate.ts";
import { buildDefaultSubject } from "../newsletterTemplate.ts";
import { loadProductsByIds } from "../productQuery.ts";
import { resendFetch } from "../../resendClient.ts";
import { loadNewsletterI18n } from "../i18n/index.ts";
import { resolveCampaignContent } from "../i18n/campaignContent.ts";
import { isValidEmail, processCampaignQueue } from "../newsletterQueue.ts";

/** Substituído por destinatário — permite guardar a preferência de idioma. */
const TOKEN_PLACEHOLDER = "%%LEGA_SUBSCRIBER_TOKEN%%";

const BATCH_SIZE = 100;

interface Recipient {
  id: string;
  email: string;
  first_name: string | null;
  unsubscribe_token: string;
  preferred_language: string | null;
}

/**
 * Resolve os destinatários de uma campanha a partir da BD (fonte de verdade).
 * Suporta: uma lista, várias listas, etiquetas e todos os subscritores.
 * Nunca devolve duplicados (dedupe por subscriber id).
 */
export async function resolveRecipients(
  supabase: any,
  campaign: Record<string, any>,
): Promise<Recipient[]> {
  const mode: string = campaign.audience_mode ?? (campaign.list_id ? "lists" : "all");
  const listIds: string[] = [
    ...(campaign.list_ids ?? []),
    ...(campaign.list_id ? [campaign.list_id] : []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);
  const tags: string[] = campaign.tags ?? [];

  const byId = new Map<string, Recipient>();
  const push = (rows: any[]) => {
    for (const s of rows ?? []) {
      if (s && s.status === "active" && !byId.has(s.id)) {
        byId.set(s.id, {
          id: s.id,
          email: s.email,
          first_name: s.first_name ?? null,
          unsubscribe_token: s.unsubscribe_token,
          preferred_language: s.preferred_language ?? null,
        });
      }
    }
  };

  const SELECT = "id, email, first_name, status, unsubscribe_token, preferred_language";

  if (mode === "all") {
    const { data } = await supabase
      .from("newsletter_subscribers").select(SELECT).eq("status", "active").limit(10000);
    push(data ?? []);
    return [...byId.values()];
  }

  if ((mode === "lists" || mode === "mixed") && listIds.length > 0) {
    const { data } = await supabase
      .from("newsletter_list_subscribers")
      .select(`subscriber:newsletter_subscribers(${SELECT})`)
      .in("list_id", listIds)
      .limit(10000);
    push(((data ?? []) as any[]).map((r) => r.subscriber));
  }

  if ((mode === "tags" || mode === "mixed") && tags.length > 0) {
    const { data } = await supabase
      .from("newsletter_subscribers")
      .select(SELECT)
      .eq("status", "active")
      .overlaps("tags", tags)
      .limit(10000);
    push(data ?? []);
  }

  return [...byId.values()];
}

function unsubUrl(supabaseUrl: string, token: string) {
  return `${supabaseUrl}/functions/v1/newsletter-unsubscribe?token=${token}`;
}

/**
 * Canal Newsletter. Reage apenas a eventos newsletter.* emitidos pelo Admin —
 * totalmente desacoplado dos canais Facebook/Instagram/sitemap.
 */
export const newsletterChannel: ChannelAdapter = {
  key: "newsletter",
  label: "Newsletter",
  supports: (e) =>
    e.event_type === "newsletter.campaign.send" ||
    e.event_type === "newsletter.campaign.cancel" ||
    e.event_type === "newsletter.instant",

  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const from =
      (ctx.channelConfig?.from as string | undefined) ??
      Deno.env.get("RESEND_FROM_EMAIL");

    if (!apiKey) {
      return {
        status: "missing_credentials",
        response: { reason: "missing RESEND_API_KEY", required: ["RESEND_API_KEY"] },
        error: "Newsletter não configurada: falta RESEND_API_KEY",
      };
    }

    const supabase = createClient(ctx.supabaseUrl, ctx.serviceRoleKey);
    let campaignId = ctx.event.payload?.campaign_id as string | undefined;

    /* ------------------- INSTANT (produto publicado) ------------------ */
    // Cria automaticamente uma campanha a partir do produto — sem qualquer
    // conteúdo introduzido manualmente. Depois segue o fluxo normal de envio.
    if (ctx.event.event_type === "newsletter.instant") {
      const productId = ctx.event.product_id;
      if (!productId) return { status: "failed", error: "product_id missing for newsletter.instant" };
      const [product] = await loadProductsByIds(supabase, [productId]);
      if (!product) return { status: "failed", error: "produto inexistente" };

      const bootI18n = await loadNewsletterI18n(supabase);
      const subject = buildDefaultSubject([product], bootI18n, bootI18n.defaultLanguage);
      const { data: created, error: createErr } = await supabase
        .from("newsletter_campaigns")
        .insert({
          title: (product.title as string) ?? subject,
          subject,
          default_language: bootI18n.defaultLanguage,
          preheader: ((product.description as string) ?? "")
            .replace(/\s+/g, " ").trim().slice(0, 140) || null,
          status: "draft",
          product_ids: [productId],
          audience_mode: "all",
          content_json: { auto_generated: true, source: "product.published" },
        })
        .select("id")
        .maybeSingle();
      if (createErr || !created) {
        return { status: "failed", error: createErr?.message ?? "falha ao criar campanha automática" };
      }
      campaignId = created.id as string;
    }

    if (!campaignId) return { status: "failed", error: "campaign_id missing in payload" };

    /* ---------------------------- CANCEL ---------------------------- */
    if (ctx.event.event_type === "newsletter.campaign.cancel") {
      const { data: c } = await supabase
        .from("newsletter_campaigns")
        .select("id, broadcast_id, status")
        .eq("id", campaignId)
        .maybeSingle();
      if (!c) return { status: "failed", error: "campaign not found" };
      if (c.status === "sent") {
        return { status: "skipped", response: { reason: "campaign already sent" } };
      }
      let remote: unknown = false;
      if (c.broadcast_id) {
        try {
          const res = await resendFetch(`/broadcasts/${c.broadcast_id}`, {
            method: "DELETE",
          });
          remote = await res.json().catch(() => ({}));
        } catch (err) {
          remote = { error: err instanceof Error ? err.message : String(err) };
        }
      }
      await supabase
        .from("newsletter_campaigns")
        .update({ status: "canceled" })
        .eq("id", campaignId);
      return { status: "success", response: { canceled: true, remote } };
    }

    /* ----------------------------- SEND ----------------------------- */
    if (!from) {
      return {
        status: "missing_credentials",
        response: { reason: "missing RESEND_FROM_EMAIL", required: ["RESEND_FROM_EMAIL"] },
        error: "Newsletter não configurada: falta RESEND_FROM_EMAIL (remetente verificado)",
      };
    }

    const { data: campaign, error: campErr } = await supabase
      .from("newsletter_campaigns")
      .select("*")
      .eq("id", campaignId)
      .maybeSingle();
    if (campErr || !campaign) {
      return { status: "failed", error: campErr?.message ?? "campaign not found" };
    }
    if (campaign.status === "canceled") {
      return { status: "skipped", response: { reason: "campaign canceled" } };
    }

    // Reenvio apenas dos falhados: `retry_failed_only` na payload do evento.
    const retryFailedOnly = ctx.event.payload?.retry_failed_only === true;
    if (campaign.status === "sent" && !retryFailedOnly) {
      return { status: "skipped", response: { reason: "campaign already sent" } };
    }

    // ---- Fila persistente: cria os destinatários (idempotente) -----------
    const recipients = await resolveRecipients(supabase, campaign);
    if (recipients.length === 0) {
      await supabase.from("newsletter_campaigns").update({
        status: "failed", last_error: "audiência sem subscritores ativos",
      }).eq("id", campaignId);
      return { status: "failed", error: "audiência sem subscritores ativos" };
    }

    // Já entregues em execuções anteriores (sistema antigo) → nunca reenviar.
    const { data: doneRows } = await supabase
      .from("newsletter_sends").select("subscriber_id")
      .eq("campaign_id", campaignId).eq("status", "sent").limit(10000);
    const alreadySent = new Set(((doneRows ?? []) as any[]).map((r) => r.subscriber_id));

    const i18n = await loadNewsletterI18n(supabase);
    const rows = recipients.map((r) => {
      const valid = isValidEmail(r.email);
      const done = alreadySent.has(r.id);
      return {
        campaign_id: campaignId,
        subscriber_id: r.id,
        email: (r.email ?? "").trim(),
        language: i18n.resolve(r.preferred_language ?? campaign.default_language),
        status: done ? "sent" : valid ? "pending" : "skipped",
        last_error: !done && !valid ? "email inválido (formato ou caracteres não-ASCII)" : null,
        sent_at: done ? new Date().toISOString() : null,
      };
    });
    // ON CONFLICT DO NOTHING — linhas já existentes (sent/failed/pending) ficam intactas.
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase.from("newsletter_send_queue")
        .upsert(rows.slice(i, i + 500), { onConflict: "campaign_id,subscriber_id", ignoreDuplicates: true });
      if (error) return { status: "failed", error: `fila: ${error.message}` };
    }
    // Reenviar falhados: volta a pôr os `failed` em pending (nunca os `sent`).
    if (retryFailedOnly) {
      await supabase.from("newsletter_send_queue")
        .update({ status: "pending", attempts: 0, next_attempt_at: null, last_error: null })
        .eq("campaign_id", campaignId).eq("status", "failed");
    }

    await supabase.from("newsletter_campaigns").update({
      status: "sending",
      send_started_at: campaign.send_started_at ?? new Date().toISOString(),
      next_run_at: new Date().toISOString(),
    }).eq("id", campaignId);

    // Processa já o máximo permitido; o resto continua via cron do dispatcher.
    const run = await processCampaignQueue(supabase, ctx.supabaseUrl, campaignId, from);
    return {
      status: "success",
      request: { mode: campaign.audience_mode ?? "all", audience: recipients.length, from },
      response: { queued: rows.length, ...run },
    };
  },
};
