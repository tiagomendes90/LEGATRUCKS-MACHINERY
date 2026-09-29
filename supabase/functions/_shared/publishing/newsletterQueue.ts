// Fila persistente de envio da newsletter (limites do plano Free do Resend).
// - Cada destinatário tem uma linha em newsletter_send_queue (único por campanha).
// - Por execução envia no máximo o que resta da quota diária (DAILY_LIMIT),
//   em batches de até 100 (limite da Batch API do Resend).
// - Quando a quota acaba, os restantes ficam `pending` e a campanha é retomada
//   automaticamente pelo cron já existente do publish-dispatcher.
import { renderNewsletterHtml } from "./newsletterTemplate.ts";
import { loadProductsByIds } from "./productQuery.ts";
import { resendFetch } from "../resendClient.ts";
import { loadNewsletterI18n } from "./i18n/index.ts";
import { resolveCampaignContent } from "./i18n/campaignContent.ts";

const TOKEN_PLACEHOLDER = "%%LEGA_SUBSCRIBER_TOKEN%%";
/** Limite diário do plano Free do Resend (confirmado pelo erro "daily email sending quota"). */
export const DAILY_LIMIT = Number(Deno.env.get("NEWSLETTER_DAILY_LIMIT") ?? "100");
const BATCH_SIZE = 100;
const MAX_ATTEMPTS = 5;
const STALE_PROCESSING_MIN = 15;

// ASCII estrito — o Resend rejeita emails com caracteres não-ASCII (422 no batch inteiro).
const EMAIL_RE = /^[A-Za-z0-9._%+\-']+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
export const isValidEmail = (e: string) => EMAIL_RE.test((e ?? "").trim());

function unsubUrl(supabaseUrl: string, token: string) {
  return `${supabaseUrl}/functions/v1/newsletter-unsubscribe?token=${token}`;
}

// Regra da quota (documentação Resend, "Usage Limits" / "Retrieve Usage"):
// a quota diária do plano Free é uma janela MÓVEL de 24 horas — não reinicia
// à meia-noite. Cada envio só deixa de contar 24h depois de ter sido feito.
const WINDOW_MS = 24 * 3600_000;
const SLOT_MARGIN_MS = 5 * 60_000;
const QUOTA_RETRY_MS = 60 * 60_000;

/** Emails enviados nas últimas 24h por TODAS as campanhas — a quota é da conta. */
async function sentInWindow(supabase: any): Promise<number> {
  const { count } = await supabase
    .from("newsletter_sends")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", new Date(Date.now() - WINDOW_MS).toISOString());
  return count ?? 0;
}

/** Momento em que o envio mais antigo da janela sai dela (liberta quota). */
async function nextQuotaSlot(supabase: any): Promise<Date> {
  const { data } = await supabase
    .from("newsletter_sends")
    .select("sent_at")
    .eq("status", "sent")
    .gte("sent_at", new Date(Date.now() - WINDOW_MS).toISOString())
    .order("sent_at", { ascending: true })
    .limit(1);
  const oldest = (data ?? [])[0]?.sent_at;
  if (!oldest) return new Date(Date.now() + QUOTA_RETRY_MS);
  return new Date(new Date(oldest).getTime() + WINDOW_MS + SLOT_MARGIN_MS);
}

async function countByStatus(supabase: any, campaignId: string) {
  const out: Record<string, number> = { pending: 0, processing: 0, sent: 0, failed: 0, skipped: 0 };
  for (const s of Object.keys(out)) {
    const { count } = await supabase
      .from("newsletter_send_queue")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", s);
    out[s] = count ?? 0;
  }
  return out;
}

/** 429 com daily/monthly_quota_exceeded (≠ rate_limit_exceeded, que é por segundo). */
function isQuotaError(status: number, body: any) {
  const txt = `${body?.name ?? ""} ${body?.message ?? body?.error ?? ""}`.toLowerCase();
  return status === 429 && (txt.includes("quota") || txt.includes("daily"));
}

export interface QueueRunResult {
  locked: boolean;
  sent: number;
  failed: number;
  waiting_quota: boolean;
  done: boolean;
  counts?: Record<string, number>;
}

/**
 * Processa a fila de UMA campanha. Idempotente e single-flight (lease na BD).
 */
export async function processCampaignQueue(
  supabase: any,
  supabaseUrl: string,
  campaignId: string,
  from: string,
): Promise<QueueRunResult> {
  const { data: gotLock } = await supabase.rpc("claim_newsletter_campaign_lock", {
    p_campaign_id: campaignId, p_seconds: 300,
  });
  if (!gotLock) return { locked: false, sent: 0, failed: 0, waiting_quota: false, done: false };

  let sent = 0, failed = 0, waitingQuota = false, providerQuota = false;
  try {
    const { data: campaign } = await supabase
      .from("newsletter_campaigns").select("*").eq("id", campaignId).maybeSingle();
    if (!campaign || campaign.status === "canceled") {
      return { locked: true, sent, failed, waiting_quota: false, done: true };
    }

    // Linhas "processing" órfãs (execução interrompida) voltam a pending.
    await supabase.from("newsletter_send_queue")
      .update({ status: "pending", locked_at: null })
      .eq("campaign_id", campaignId).eq("status", "processing")
      .lt("locked_at", new Date(Date.now() - STALE_PROCESSING_MIN * 60_000).toISOString());

    let remaining = Math.max(0, DAILY_LIMIT - (await sentInWindow(supabase)));

    // Conteúdo (versões por idioma) — exatamente a mesma renderização de antes.
    const products = await loadProductsByIds(supabase, campaign.product_ids ?? []);
    let template: Record<string, any> | null = null;
    if (campaign.template_id) {
      const { data: t } = await supabase
        .from("newsletter_templates").select("*").eq("id", campaign.template_id).maybeSingle();
      template = t ?? null;
    }
    const i18n = await loadNewsletterI18n(supabase);
    const { data: trRows } = await supabase
      .from("newsletter_campaign_translations").select("*").eq("campaign_id", campaignId);
    const translations = (trRows ?? []) as any[];
    const cache = new Map<string, { html: string; subject: string }>();
    const versionFor = (code: string) => {
      const lang = i18n.resolve(code);
      if (cache.has(lang)) return cache.get(lang)!;
      const content = resolveCampaignContent(campaign, lang, i18n, translations, template?.content_json ?? null);
      const html = renderNewsletterHtml({
        campaign: {
          title: campaign.title, subject: campaign.subject,
          preheader: campaign.preheader, content_json: campaign.content_json,
        },
        template: template?.content_json ?? null,
        products, i18n, lang, translations,
        publicNumber: campaign.public_number ?? null,
        subscriberToken: TOKEN_PLACEHOLDER,
      });
      const v = { html, subject: content.subject };
      cache.set(lang, v);
      return v;
    };

    while (remaining > 0 && !waitingQuota) {
      const nowIso = new Date().toISOString();
      const { data: rows } = await supabase
        .from("newsletter_send_queue")
        .select("id, subscriber_id, email, language, attempts, subscriber:newsletter_subscribers(unsubscribe_token, status)")
        .eq("campaign_id", campaignId).eq("status", "pending")
        .or(`next_attempt_at.is.null,next_attempt_at.lte.${nowIso}`)
        .order("created_at", { ascending: true })
        .limit(Math.min(remaining, BATCH_SIZE));
      const all = (rows ?? []) as any[];
      if (all.length === 0) break;

      // Quem se desinscreveu entretanto → skipped.
      const unsub = all.filter((r) => r.subscriber?.status !== "active");
      if (unsub.length) {
        await supabase.from("newsletter_send_queue")
          .update({ status: "skipped", last_error: "subscritor inativo" })
          .in("id", unsub.map((r) => r.id));
      }
      const batch = all.filter((r) => r.subscriber?.status === "active");
      if (batch.length === 0) continue;

      // Claim (pending → processing) só destas linhas.
      const { data: claimed } = await supabase.from("newsletter_send_queue")
        .update({ status: "processing", locked_at: nowIso })
        .in("id", batch.map((r) => r.id)).eq("status", "pending")
        .select("id");
      const claimedIds = new Set(((claimed ?? []) as any[]).map((r) => r.id));
      const chunk = batch.filter((r) => claimedIds.has(r.id));
      if (chunk.length === 0) break;

      // Um pedido batch por idioma.
      const byLang = new Map<string, any[]>();
      for (const r of chunk) {
        const l = i18n.resolve(r.language ?? campaign.default_language);
        (byLang.get(l) ?? byLang.set(l, []).get(l)!).push(r);
      }

      for (const [lang, group] of byLang) {
        if (waitingQuota) {
          await supabase.from("newsletter_send_queue")
            .update({ status: "pending", locked_at: null }).in("id", group.map((r) => r.id));
          continue;
        }
        const v = versionFor(lang);
        const payload = group.map((r) => {
          const tok = r.subscriber.unsubscribe_token;
          const u = unsubUrl(supabaseUrl, tok);
          return {
            from, to: [r.email.trim()], subject: v.subject,
            html: v.html.replaceAll(TOKEN_PLACEHOLDER, tok)
              .replaceAll("{{{RESEND_UNSUBSCRIBE_URL}}}", u)
              .replaceAll("{{RESEND_UNSUBSCRIBE_URL}}", u),
          };
        });
        // Idempotency-Key: se a execução for interrompida após o Resend aceitar,
        // o mesmo lote não é enviado duas vezes (janela de 24h do Resend).
        const idemKey = `nl-${campaignId}-${group.map((r) => r.id).sort().join("").slice(0, 200)}`;
        let status = 0, body: any = {};
        try {
          const res = await resendFetch("/emails/batch", {
            method: "POST",
            headers: { "Idempotency-Key": idemKey.slice(0, 256) },
            body: JSON.stringify(payload),
          });
          status = res.status;
          body = await res.json().catch(() => ({}));
        } catch (err) {
          body = { message: err instanceof Error ? err.message : String(err) };
        }

        if (status >= 200 && status < 300) {
          const ids = (body?.data ?? []) as any[];
          const at = new Date().toISOString();
          for (let i = 0; i < group.length; i++) {
            const r = group[i];
            await supabase.from("newsletter_send_queue").update({
              status: "sent", sent_at: at, locked_at: null, last_error: null,
              resend_message_id: ids[i]?.id ?? null, attempts: r.attempts + 1,
            }).eq("id", r.id);
          }
          const { error: logErr } = await supabase.from("newsletter_sends").insert(group.map((r, i) => ({
            campaign_id: campaignId, subscriber_id: r.subscriber_id, channel_key: "newsletter",
            language: lang, status: "sent", resend_message_id: ids[i]?.id ?? null,
            raw_response: {}, sent_at: at,
          })));
          if (logErr) console.warn("[newsletter-queue] log sends", logErr.message);
          sent += group.length;
          remaining -= group.length;
          continue;
        }

        const msg = body?.message ?? `HTTP ${status}`;
        const ids = group.map((r) => r.id);
        if (isQuotaError(status, body)) {
          // Quota diária esgotada — nada enviado; mantém pending.
          waitingQuota = true;
          providerQuota = true;
          await supabase.from("newsletter_send_queue")
            .update({ status: "pending", locked_at: null, last_error: msg }).in("id", ids);
          continue;
        }
        const transient = status === 0 || status === 429 || status >= 500;
        if (transient) {
          for (const r of group) {
            const att = r.attempts + 1;
            await supabase.from("newsletter_send_queue").update(att >= MAX_ATTEMPTS
              ? { status: "failed", attempts: att, locked_at: null, last_error: msg }
              : { status: "pending", attempts: att, locked_at: null, last_error: msg,
                  next_attempt_at: new Date(Date.now() + 2 ** att * 60_000).toISOString() },
            ).eq("id", r.id);
            if (att >= MAX_ATTEMPTS) failed++;
          }
          // Evita martelar o fornecedor nesta execução.
          remaining = 0;
          continue;
        }
        // Erro permanente (4xx) → failed com motivo.
        await supabase.from("newsletter_send_queue")
          .update({ status: "failed", locked_at: null, last_error: msg, attempts: group[0].attempts + 1 })
          .in("id", ids);
        await supabase.from("newsletter_sends").insert(group.map((r) => ({
          campaign_id: campaignId, subscriber_id: r.subscriber_id, channel_key: "newsletter",
          language: lang, status: "failed", error: msg, raw_response: body,
        })));
        failed += group.length;
      }
    }

    if (remaining <= 0) waitingQuota = true;

    const counts = await countByStatus(supabase, campaignId);
    const open = counts.pending + counts.processing;
    const total = counts.pending + counts.processing + counts.sent + counts.failed + counts.skipped;
    const done = open === 0;
    const now = new Date();
    // Próxima execução:
    //  - Resend respondeu 429 quota (ex.: outros emails da conta gastaram quota) → tenta daqui a 1h;
    //  - limite local esgotado → quando o envio mais antigo das últimas 24h sair da janela;
    //  - apenas retries temporários → daqui a 1 min.
    const nextRun = done ? null
      : providerQuota ? new Date(now.getTime() + QUOTA_RETRY_MS)
      : waitingQuota ? await nextQuotaSlot(supabase)
      : new Date(now.getTime() + 60_000);

    await supabase.from("newsletter_campaigns").update({
      status: done ? (counts.sent > 0 ? "sent" : "failed") : "sending",
      recipients_count: total,
      sent_count: counts.sent,
      delivered_count: counts.sent,
      failed_count: counts.failed,
      next_run_at: nextRun?.toISOString() ?? null,
      last_sent_at: sent > 0 ? now.toISOString() : campaign.last_sent_at,
      ...(done ? { sent_at: now.toISOString(), send_finished_at: now.toISOString() } : {}),
      content_html: versionFor(campaign.default_language ?? i18n.defaultLanguage).html,
      last_error: counts.failed > 0 ? `${counts.failed} destinatários falharam` : null,
      stats: {
        ...(campaign.stats ?? {}),
        queue: { ...counts, total, daily_limit: DAILY_LIMIT, waiting_quota: !done && waitingQuota },
      },
    }).eq("id", campaignId);

    return { locked: true, sent, failed, waiting_quota: !done && waitingQuota, done, counts };
  } finally {
    await supabase.from("newsletter_campaigns")
      .update({ queue_locked_until: null }).eq("id", campaignId);
  }
}

/** Chamado pelo cron do dispatcher: retoma campanhas com fila pendente e vencidas. */
export async function processDueNewsletterQueues(supabase: any, supabaseUrl: string) {
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!from || !Deno.env.get("RESEND_API_KEY")) return [];
  const { data } = await supabase
    .from("newsletter_campaigns")
    .select("id")
    .eq("status", "sending")
    .not("next_run_at", "is", null)
    .lte("next_run_at", new Date().toISOString())
    .order("next_run_at", { ascending: true })
    .limit(3);
  const out = [];
  for (const c of (data ?? []) as any[]) {
    try {
      out.push({ id: c.id, ...(await processCampaignQueue(supabase, supabaseUrl, c.id, from)) });
    } catch (err) {
      console.error("[newsletter-queue] campaign failed", c.id, err);
    }
  }
  return out;
}
