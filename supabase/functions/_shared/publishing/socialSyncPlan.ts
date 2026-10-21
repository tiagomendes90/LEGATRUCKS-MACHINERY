// Plano de reconciliação do social-sync, extraído como função pura e testável.
// Recebe os resultados da Graph API e devolve o conjunto MÍNIMO de escritas
// agrupadas a executar — sem tocar na base de dados.
//
// Semântica preservada (igual à versão anterior do social-sync):
//   • post vivo (res.ok && json.id)        → last_verified_at=now, verification_error=null
//   • problema de ligação/permissões/rate  → regista verification_error, NUNCA remove
//   • objeto inexistente na Meta           → status='removed', limpa external_id/url
//   • outro erro                           → regista verification_error
export interface SyncPostInput {
  id: string;
  product_id: string | null;
  channel_key: string;
  external_id: string | null;
  external_url: string | null;
  status: string;
}

export interface GraphCheckResult {
  post: SyncPostInput;
  /** true quando a Graph API confirmou o objeto (res.ok && json.id). */
  ok: boolean;
  /** json.error devolvido pela Graph API (quando existe). */
  error: unknown;
  httpStatus: number;
  /** resposta JSON completa (para formatMetaError). */
  json: unknown;
}

export interface SyncPlanDeps {
  formatMetaError: (json: unknown, httpStatus: number) => string;
  isGone: (err: unknown) => boolean;
  classifyConnectionProblem: (err: unknown) => { problem: boolean; kind?: string };
}

export interface RemovedEntry {
  post: SyncPostInput;
  /** Mensagem de erro formatada, gravada em verification_error. */
  error: string;
  /** Erro bruto da Meta, gravado em raw_response.meta_error. */
  metaError: unknown;
}

export interface SyncPlan {
  /** IDs de posts vivos — uma única actualização em lote. */
  liveIds: string[];
  /** Erros agrupados por mensagem — uma actualização em lote por grupo. */
  errorGroups: Array<{ kind: "connection" | "unknown"; error: string; ids: string[] }>;
  /** Posts removidos na Meta — actualizações individuais (raros). */
  removed: RemovedEntry[];
  /** Primeiro problema de ligação detectado (para meta_connections.last_error). */
  connectionIssue: string | null;
  /** Detalhe por post, devolvido na resposta da função. */
  details: Array<{ post_id: string; channel: string; state: string }>;
}

export function buildSyncPlan(results: GraphCheckResult[], deps: SyncPlanDeps): SyncPlan {
  const plan: SyncPlan = {
    liveIds: [],
    errorGroups: [],
    removed: [],
    connectionIssue: null,
    details: [],
  };
  const groupIndex = new Map<string, { kind: "connection" | "unknown"; error: string; ids: string[] }>();

  for (const { post, ok, error, httpStatus, json } of results) {
    if (ok) {
      plan.liveIds.push(post.id);
      plan.details.push({ post_id: post.id, channel: post.channel_key, state: "live" });
      continue;
    }

    const conn = deps.classifyConnectionProblem(error);
    if (conn.problem) {
      if (!plan.connectionIssue) plan.connectionIssue = conn.kind ?? "connection_error";
      const formatted = deps.formatMetaError(json, httpStatus);
      const key = `connection:${formatted}`;
      let group = groupIndex.get(key);
      if (!group) {
        group = { kind: "connection", error: formatted, ids: [] };
        groupIndex.set(key, group);
        plan.errorGroups.push(group);
      }
      group.ids.push(post.id);
      plan.details.push({ post_id: post.id, channel: post.channel_key, state: conn.kind ?? "connection_error" });
      continue;
    }

    if (deps.isGone(error)) {
      plan.removed.push({ post, error: deps.formatMetaError(json, httpStatus), metaError: error ?? null });
      plan.details.push({ post_id: post.id, channel: post.channel_key, state: "removed" });
      continue;
    }

    const formatted = deps.formatMetaError(json, httpStatus);
    const key = `unknown:${formatted}`;
    let group = groupIndex.get(key);
    if (!group) {
      group = { kind: "unknown", error: formatted, ids: [] };
      groupIndex.set(key, group);
      plan.errorGroups.push(group);
    }
    group.ids.push(post.id);
    plan.details.push({ post_id: post.id, channel: post.channel_key, state: "unknown_error" });
  }

  return plan;
}

/**
 * Cláusula PostgREST que impede resultados concorrentes/desactualizados de
 * substituírem informação mais recente: só grava se a última verificação
 * registada for anterior ao início DESTA execução (ou inexistente).
 */
export function staleGuardClause(runStartedAt: string): string {
  return `last_verified_at.is.null,last_verified_at.lt.${runStartedAt}`;
}
