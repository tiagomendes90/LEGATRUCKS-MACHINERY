import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";
import { renderNewsletterHtml } from "../newsletterTemplate.ts";
import { buildDefaultSubject } from "../newsletterTemplate.ts";
import { loadProductsByIds } from "../productQuery.ts";
import { resendFetch } from "../../resendClient.ts";
import { loadNewsletterI18n } from "../i18n/index.ts";
import { resolveCampaignContent } from "../i18n/campaignContent.ts";

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

      const subject = buildDefaultSubject([product]);
      const { data: created, error: createErr } = await supabase
        .from("newsletter_campaigns")
        .insert({
          title: (product.title as string) ?? subject,
          subject,
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

    // Produtos (ordem definida pelo admin) — mesma query partilhada por
    // Facebook/Instagram/preview, garantindo conteúdo base idêntico.
    const products = await loadProductsByIds(supabase, campaign.product_ids ?? []);

    // Template reutilizável (cabeçalho / rodapé / intro / fecho)
    let template: Record<string, any> | null = null;
    if (campaign.template_id) {
      const { data: t } = await supabase
        .from("newsletter_templates").select("*").eq("id", campaign.template_id).maybeSingle();
      template = t ?? null;
    }

    const html = renderNewsletterHtml({
      campaign: {
        title: campaign.title,
        subject: campaign.subject,
        preheader: campaign.preheader,
        content_json: campaign.content_json,
      },
      template: template?.content_json ?? null,
      products,
    });

    // Destinatários já entregues com sucesso — nunca reenviar.
    const { data: doneRows } = await supabase
      .from("newsletter_sends")
      .select("subscriber_id")
      .eq("campaign_id", campaignId)
      .eq("status", "sent")
      .limit(10000);
    const alreadySent = new Set(
      ((doneRows ?? []) as any[]).map((r) => r.subscriber_id).filter(Boolean),
    );

    let recipients = await resolveRecipients(supabase, campaign);
    const totalAudience = recipients.length;
    recipients = recipients.filter((r) => !alreadySent.has(r.id));

    if (recipients.length === 0) {
      await supabase.from("newsletter_campaigns").update({
        status: totalAudience > 0 ? "sent" : "failed",
        last_error: totalAudience > 0 ? null : "audiência sem subscritores ativos",
      }).eq("id", campaignId);
      return {
        status: totalAudience > 0 ? "success" : "failed",
        response: { reason: totalAudience > 0 ? "all recipients already delivered" : "empty audience" },
        error: totalAudience > 0 ? undefined : "audiência sem subscritores ativos",
      };
    }

    const startedAt = new Date();
    await supabase.from("newsletter_campaigns").update({
      status: "sending",
      send_started_at: startedAt.toISOString(),
      recipients_count: totalAudience,
    }).eq("id", campaignId);

    const batches: Record<string, unknown>[] = [];
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE);
      let ok = false;
      let json: any = {};
      let status = 0;
      try {
        const res = await resendFetch(`/emails/batch`, {
          method: "POST",
          body: JSON.stringify(
            chunk.map((s) => ({
              from,
              to: [s.email],
              subject: campaign.subject,
              html: html.replaceAll(
                "{{{RESEND_UNSUBSCRIBE_URL}}}",
                unsubUrl(ctx.supabaseUrl, s.unsubscribe_token),
              ).replaceAll(
                "{{RESEND_UNSUBSCRIBE_URL}}",
                unsubUrl(ctx.supabaseUrl, s.unsubscribe_token),
              ),
            })),
          ),
        });
        status = res.status;
        json = await res.json().catch(() => ({}));
        ok = res.ok;
      } catch (err) {
        json = { error: err instanceof Error ? err.message : String(err) };
      }

      ok ? (sent += chunk.length) : (failed += chunk.length);
      batches.push({ ok, status, size: chunk.length, body: json });

      const ids = (json?.data ?? []) as any[];
      // Insert (não upsert): o índice único parcial garante que um envio
      // bem-sucedido nunca é duplicado; falhas ficam no histórico.
      const { error: logErr } = await supabase.from("newsletter_sends").insert(
        chunk.map((s, idx) => ({
          campaign_id: campaignId,
          subscriber_id: s.id,
          channel_key: "newsletter",
          status: ok ? "sent" : "failed",
          resend_message_id: ok ? (ids[idx]?.id ?? null) : null,
          error: ok ? null : (json?.message ?? `HTTP ${status}`),
          raw_response: json,
          sent_at: ok ? new Date().toISOString() : null,
        })),
      );
      if (logErr) console.warn("[newsletter] failed to log sends", logErr.message);
    }

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    const finalStatus = sent === 0 ? "failed" : "sent";

    await supabase.from("newsletter_campaigns").update({
      status: finalStatus,
      sent_at: finishedAt.toISOString(),
      send_finished_at: finishedAt.toISOString(),
      duration_ms: durationMs,
      content_html: html,
      recipients_count: totalAudience,
      sent_count: (campaign.sent_count ?? 0) + sent,
      delivered_count: (campaign.delivered_count ?? 0) + sent,
      failed_count: failed,
      last_error: failed > 0 ? `${failed} destinatários falharam` : null,
      stats: {
        mode: campaign.audience_mode ?? "all",
        audience: totalAudience,
        attempted: recipients.length,
        skipped_already_sent: totalAudience - recipients.length,
        sent,
        failed,
        duration_ms: durationMs,
        retry_failed_only: retryFailedOnly,
      },
    }).eq("id", campaignId);

    return {
      status: finalStatus === "failed" ? "failed" : "success",
      request: {
        mode: campaign.audience_mode ?? "all",
        list_ids: campaign.list_ids ?? [],
        tags: campaign.tags ?? [],
        audience: totalAudience,
        attempted: recipients.length,
        from,
      },
      response: { batches, sent, failed, duration_ms: durationMs },
      error: failed > 0 ? `${failed} destinatários falharam` : undefined,
    };
  },
};
