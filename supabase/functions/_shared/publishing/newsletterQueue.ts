// Fila persistente de envio da newsletter (limites do plano Free do Resend).
// - Cada destinatário tem uma linha em newsletter_send_queue (único por campanha).
// - Por execução envia no máximo o que resta da quota diária da CONTA Resend,
//   em batches de até 100 (limite da Batch API do Resend).
// - Quota: dia UTC (00:00–24:00). Fonte principal = header `x-resend-daily-quota`
//   devolvido pelo próprio Resend (conta tudo: newsletters, testes, notificações,
//   emails recebidos). A contagem interna só serve de piso/segurança.
// - Quando a quota acaba, os restantes ficam `pending` e a campanha é retomada
//   pelo cron do publish-dispatcher às 00:05 UTC do dia seguinte.
import { renderNewsletterHtml } from "./newsletterTemplate.ts";
import { loadProductsByIds } from "./productQuery.ts";
import { resendFetch as realResendFetch } from "../resendClient.ts";
import { loadNewsletterI18n } from "./i18n/index.ts";
import { resolveCampaignContent } from "./i18n/campaignContent.ts";

const TOKEN_PLACEHOLDER = "%%LEGA_SUBSCRIBER_TOKEN%%";
/** Limite diário do plano Free do Resend. */
export const DAILY_LIMIT = Number(Deno.env.get("NEWSLETTER_DAILY_LIMIT") ?? "100");
const BATCH_SIZE = 100;
const MAX_ATTEMPTS = 5;
const STALE_PROCESSING_MIN = 15;
const RESET_MARGIN_MS = 5 * 60_000;
const ACCOUNT_ERROR_RETRY_MS = 60 * 60_000;

// ASCII estrito — o Resend rejeita emails com caracteres não-ASCII.
const EMAIL_RE = /^[A-Za-z0-9._%+\-']+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
export const isValidEmail = (e: string) => EMAIL_RE.test((e ?? "").trim());

/* ----------------------- ganchos de teste (simulação) ----------------------- */
// Em produção: fetch real via gateway e relógio real. A simulação substitui ambos
// para NUNCA chamar a API do Resend.
let resendFetch: (path: string, init?: RequestInit) => Promise<Response> = realResendFetch;
let nowMs: () => number = () => Date.now();
export function __setQueueTestHooks(h: {
  fetch?: typeof resendFetch;
  now?: () => number;
}) {
  if (h.fetch) resendFetch = h.fetch;
  if (h.now) nowMs = h.now;
}

function unsubUrl(supabaseUrl: string, token: string) {
  return `${supabaseUrl}/functions/v1/newsletter-unsubscribe?token=${token}`;
}

/* --------------------------------- quota ---------------------------------- */
/** 00:00 UTC do dia corrente. */
export function utcDayStart(ms: number): Date {
  const d = new Date(ms);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
/** Próximo reinício da quota: 00:00 UTC do dia seguinte + 5 min de margem. */
export function nextUtcReset(ms: number): Date {
  return new Date(utcDayStart(ms).getTime() + 24 * 3600_000 + RESET_MARGIN_MS);
}

/** Lê `x-resend-daily-quota` (emails já contabilizados hoje pelo Resend). */
function readQuotaHeader(res: Response): number | null {
  const raw = res.headers.get("x-resend-daily-quota");
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Pedido barato e sem envio (GET /domains) só para ler o header de quota. */
async function probeProviderUsage(): Promise<number | null> {
  try {
    const res = await resendFetch("/domains", { method: "GET" });
    await res.text().catch(() => "");
    return readQuotaHeader(res);
  } catch {
    return null;
  }
}

/** Contagem interna (piso de segurança): newsletters enviadas hoje (dia UTC). */
async function sentTodayInternal(supabase: any): Promise<number> {
  const { count } = await supabase
    .from("newsletter_sends")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", utcDayStart(nowMs()).toISOString());
  return count ?? 0;
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

/* ---------------------------- classificação --------------------------------- */
/** 429 com daily/monthly_quota_exceeded (≠ rate_limit_exceeded, que é por segundo). */
function isQuotaError(status: number, body: any) {
  const txt = `${body?.name ?? ""} ${body?.message ?? body?.error ?? ""}`.toLowerCase();
  return status === 429 && (txt.includes("quota") || txt.includes("daily"));
}
/** Erro de validação de dados (algum destinatário/campo inválido). */
function isValidationError(status: number, body: any) {
  const name = String(body?.name ?? "").toLowerCase();
  return status === 422 || (status === 400 && name.includes("validation"));
}
/** Erro da conta (chave, domínio não verificado…) — nada a ver com destinatários. */
function isAccountError(status: number) {
  return status === 401 || status === 403;
}
/** Tenta extrair o índice do email culpado da mensagem do Resend (ex.: "emails[3].to"). */
function culpritIndex(msg: string, size: number): number | null {
  const m = /\[(\d+)\]/.exec(msg ?? "");
  if (!m) return null;
  const i = Number(m[1]);
  return i >= 0 && i < size ? i : null;
}

export interface QueueRunResult {
  locked: boolean;
  sent: number;
  failed: number;
  skipped: number;
  waiting_quota: boolean;
  done: boolean;
  quota?: { provider_used: number | null; internal_used: number; used: number; limit: number };
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
  if (!gotLock) return { locked: false, sent: 0, failed: 0, skipped: 0, waiting_quota: false, done: false };

  let sent = 0, failed = 0, skipped = 0;
  let waitingQuota = false, accountError = false, transientStop = false;
  try {
    const { data: campaign } = await supabase
      .from("newsletter_campaigns").select("*").eq("id", campaignId).maybeSingle();
    if (!campaign || campaign.status === "canceled") {
      return { locked: true, sent, failed, skipped, waiting_quota: false, done: true };
    }

    // Linhas "processing" órfãs (execução interrompida) voltam a pending.
    await supabase.from("newsletter_send_queue")
      .update({ status: "pending", locked_at: null })
      .eq("campaign_id", campaignId).eq("status", "processing")
      .lt("locked_at", new Date(nowMs() - STALE_PROCESSING_MIN * 60_000).toISOString());

    // Quota usada hoje = máximo entre o que o Resend diz e a contagem interna.
    const providerUsed = await probeProviderUsage();
    const internalUsed = await sentTodayInternal(supabase);
    let used = Math.max(providerUsed ?? 0, internalUsed);
    const quotaInfo = { provider_used: providerUsed, internal_used: internalUsed, used, limit: DAILY_LIMIT };
    let remaining = Math.max(0, DAILY_LIMIT - used);

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

    const markSent = async (rows: any[], ids: (string | null)[], lang: string) => {
      if (rows.length === 0) return;
      const at = new Date(nowMs()).toISOString();
      // 1 única instrução atómica marca o lote como `sent` logo após o Resend
      // aceitar. Se a execução cair ANTES disto, o mesmo lote é reconstruído
      // (mesmas linhas, mesma Idempotency-Key) e o Resend não reenvia.
      await supabase.from("newsletter_send_queue").update({
        status: "sent", sent_at: at, locked_at: null, last_error: null,
      }).in("id", rows.map((r) => r.id));
      for (let i = 0; i < rows.length; i++) {
        if (!ids[i]) continue;
        await supabase.from("newsletter_send_queue")
          .update({ resend_message_id: ids[i] }).eq("id", rows[i].id);
      }
      const { error: logErr } = await supabase.from("newsletter_sends").insert(rows.map((r, i) => ({
        campaign_id: campaignId, subscriber_id: r.subscriber_id, channel_key: "newsletter",
        language: lang, status: "sent", resend_message_id: ids[i] ?? null,
        raw_response: {}, sent_at: at,
      })));
      if (logErr) console.warn("[newsletter-queue] log sends", logErr.message);
      sent += rows.length;
      remaining -= rows.length;
    };

    const markInvalid = async (row: any, reason: string, lang: string) => {
      await supabase.from("newsletter_send_queue").update({
        status: "skipped", locked_at: null, attempts: row.attempts + 1,
        last_error: `rejeitado pelo Resend (endereço inválido): ${reason}`,
      }).eq("id", row.id);
      await supabase.from("newsletter_sends").insert({
        campaign_id: campaignId, subscriber_id: row.subscriber_id, channel_key: "newsletter",
        language: lang, status: "skipped", error: reason, raw_response: {},
      });
      skipped++;
    };

    const backToPending = async (rows: any[], msg: string | null) => {
      if (rows.length === 0) return;
      await supabase.from("newsletter_send_queue")
        .update({ status: "pending", locked_at: null, ...(msg ? { last_error: msg } : {}) })
        .in("id", rows.map((r) => r.id));
    };

    /** Envia um grupo (mesmo idioma). Isola destinatários inválidos sem afetar os outros. */
    const sendGroup = async (lang: string, group: any[]): Promise<void> => {
      if (group.length === 0) return;
      if (waitingQuota || accountError || transientStop) return backToPending(group, null);
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
      // Idempotency-Key determinística por conjunto de linhas.
      const idemKey = `nl-${campaignId}-${group.map((r) => r.id).sort().join("")}`.slice(0, 256);
      let status = 0, body: any = {};
      let hdr: number | null = null;
      try {
        const res = await resendFetch("/emails/batch", {
          method: "POST",
          // permissive: o Resend envia os válidos e devolve os inválidos em `errors[]`
          headers: { "Idempotency-Key": idemKey, "x-batch-validation": "permissive" },
          body: JSON.stringify(payload),
        });
        status = res.status;
        const h = readQuotaHeader(res);
        body = await res.json().catch(() => ({}));
        hdr = h;
      } catch (err) {
        body = { message: err instanceof Error ? err.message : String(err) };
      }

      if (status >= 200 && status < 300) {
        const errs = (Array.isArray(body?.errors) ? body.errors : []) as any[];
        const badIdx = new Map<number, string>();
        for (const e of errs) {
          const i = Number(e?.index);
          if (Number.isInteger(i) && i >= 0 && i < group.length) badIdx.set(i, String(e?.message ?? "inválido"));
        }
        const okRows = group.filter((_, i) => !badIdx.has(i));
        const ids = ((body?.data ?? []) as any[]).map((d) => d?.id ?? null);
        await markSent(okRows, ids, lang);
        // O header já inclui este lote; nunca contar a dobrar.
        used = Math.max(used + okRows.length, hdr ?? 0);
        for (const [i, reason] of badIdx) await markInvalid(group[i], reason, lang);
        return;
      }

      const msg = body?.message ?? `HTTP ${status}`;
      if (isQuotaError(status, body)) {
        // Quota esgotada no Resend — nada enviado; mantém pending até 00:05 UTC.
        waitingQuota = true;
        return backToPending(group, msg);
      }
      if (isAccountError(status)) {
        // Problema da conta, não dos destinatários — ninguém fica falhado.
        accountError = true;
        return backToPending(group, `erro da conta Resend: ${msg}`);
      }
      if (isValidationError(status, body)) {
        // Lote inteiro rejeitado (nada enviado). Isolar o culpado:
        if (group.length === 1) return markInvalid(group[0], msg, lang);
        const i = culpritIndex(msg, group.length);
        if (i != null) {
          await markInvalid(group[i], msg, lang);
          return sendGroup(lang, group.filter((_, k) => k !== i));
        }
        // Sem índice identificável → divide em metades (rejeições não gastam quota).
        const mid = Math.ceil(group.length / 2);
        await sendGroup(lang, group.slice(0, mid));
        await sendGroup(lang, group.slice(mid));
        return;
      }
      // Temporário (rede, 5xx, 429 rate limit) → pending com backoff; failed ao fim de MAX_ATTEMPTS.
      for (const r of group) {
        const att = r.attempts + 1;
        await supabase.from("newsletter_send_queue").update(att >= MAX_ATTEMPTS
          ? { status: "failed", attempts: att, locked_at: null, last_error: msg }
          : { status: "pending", attempts: att, locked_at: null, last_error: msg,
              next_attempt_at: new Date(nowMs() + 2 ** att * 60_000).toISOString() },
        ).eq("id", r.id);
        if (att >= MAX_ATTEMPTS) failed++;
      }
      transientStop = true; // evita martelar o fornecedor nesta execução
    };

    while (remaining > 0 && !waitingQuota && !accountError && !transientStop) {
      const nowIso = new Date(nowMs()).toISOString();
      const { data: rows } = await supabase
        .from("newsletter_send_queue")
        .select("id, subscriber_id, email, language, attempts, subscriber:newsletter_subscribers(unsubscribe_token, status)")
        .eq("campaign_id", campaignId).eq("status", "pending")
        .or(`next_attempt_at.is.null,next_attempt_at.lte.${nowIso}`)
        .order("created_at", { ascending: true })
        .limit(Math.min(remaining, BATCH_SIZE));
      const all = (rows ?? []) as any[];
      if (all.length === 0) break;

      const unsub = all.filter((r) => r.subscriber?.status !== "active");
      if (unsub.length) {
        await supabase.from("newsletter_send_queue")
          .update({ status: "skipped", last_error: "subscritor inativo" })
          .in("id", unsub.map((r) => r.id));
      }
      const batch = all.filter((r) => r.subscriber?.status === "active");
      if (batch.length === 0) continue;

      const { data: claimed } = await supabase.from("newsletter_send_queue")
        .update({ status: "processing", locked_at: nowIso })
        .in("id", batch.map((r) => r.id)).eq("status", "pending")
        .select("id");
      const claimedIds = new Set(((claimed ?? []) as any[]).map((r) => r.id));
      const chunk = batch.filter((r) => claimedIds.has(r.id));
      if (chunk.length === 0) break;

      const byLang = new Map<string, any[]>();
      for (const r of chunk) {
        const l = i18n.resolve(r.language ?? campaign.default_language);
        (byLang.get(l) ?? byLang.set(l, []).get(l)!).push(r);
      }
      for (const [lang, group] of byLang) await sendGroup(lang, group);
    }

    if (remaining <= 0) waitingQuota = true;

    const counts = await countByStatus(supabase, campaignId);
    const open = counts.pending + counts.processing;
    const total = open + counts.sent + counts.failed + counts.skipped;
    const done = open === 0;
    const now = nowMs();
    const nextRun = done ? null
      : waitingQuota ? nextUtcReset(now)
      : accountError ? new Date(now + ACCOUNT_ERROR_RETRY_MS)
      : new Date(now + 60_000);

    await supabase.from("newsletter_campaigns").update({
      status: done ? (counts.sent > 0 ? "sent" : "failed") : "sending",
      recipients_count: total,
      sent_count: counts.sent,
      delivered_count: counts.sent,
      failed_count: counts.failed,
      next_run_at: nextRun?.toISOString() ?? null,
      last_sent_at: sent > 0 ? new Date(now).toISOString() : campaign.last_sent_at,
      ...(done ? { sent_at: new Date(now).toISOString(), send_finished_at: new Date(now).toISOString() } : {}),
      content_html: versionFor(campaign.default_language ?? i18n.defaultLanguage).html,
      last_error: accountError ? "erro da conta Resend — a tentar de novo em 1h"
        : counts.failed > 0 ? `${counts.failed} destinatários falharam` : null,
      stats: {
        ...(campaign.stats ?? {}),
        queue: {
          ...counts, total, daily_limit: DAILY_LIMIT, waiting_quota: !done && waitingQuota,
          quota_used_today: used, quota_source: providerUsed != null ? "resend_header" : "internal",
        },
      },
    }).eq("id", campaignId);

    quotaInfo.used = used;
    return { locked: true, sent, failed, skipped, waiting_quota: !done && waitingQuota, done, quota: quotaInfo, counts };
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
    .lte("next_run_at", new Date(nowMs()).toISOString())
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
