import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";
import { renderNewsletterHtml } from "../newsletterTemplate.ts";
import { resendFetch } from "../../_shared/resendClient.ts";

const BATCH_SIZE = 100;

interface Recipient {
  id: string;
  email: string;
  first_name: string | null;
  unsubscribe_token: string;
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
        });
      }
    }
  };

  const SELECT = "id, email, first_name, status, unsubscribe_token";

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
    e.event_type === "newsletter.campaign.cancel",

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
    const campaignId = ctx.event.payload?.campaign_id as string | undefined;
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

    // Produtos (ordem definida pelo admin)
    const productIds: string[] = campaign.product_ids ?? [];
    let products: Record<string, unknown>[] = [];
    if (productIds.length > 0) {
      const { data: prods } = await supabase
        .from("products")
        .select("id, title, description, price, currency, year, brand:brands(name, slug), images:product_images(image_url, is_primary, sort_order)")
        .in("id", productIds);
      const byId = new Map((prods ?? []).map((p: any) => [p.id, p]));
      products = productIds.map((id) => byId.get(id)).filter(Boolean) as any;
    }

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
