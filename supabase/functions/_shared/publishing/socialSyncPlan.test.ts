// Testes unitários do plano de reconciliação do social-sync (puros, sem BD).
import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildSyncPlan, staleGuardClause } from "./socialSyncPlan.ts";
import type { GraphCheckResult, SyncPostInput } from "./socialSyncPlan.ts";

// Dependências reais (mesmas funções usadas em produção).
import { formatMetaError } from "./metaClient.ts";
import { isGoneError, classifyConnectionProblem } from "./socialDelete.ts";

const deps = { formatMetaError, isGone: isGoneError, classifyConnectionProblem };

function post(id: string, over: Partial<SyncPostInput> = {}): SyncPostInput {
  return {
    id,
    product_id: `prod-${id}`,
    channel_key: "facebook",
    external_id: `ext-${id}`,
    external_url: `https://facebook.com/${id}`,
    status: "published",
    ...over,
  };
}

function live(id: string): GraphCheckResult {
  return { post: post(id), ok: true, error: null, httpStatus: 200, json: { id: `ext-${id}` } };
}

function errResult(id: string, error: unknown, httpStatus = 400): GraphCheckResult {
  return { post: post(id), ok: false, error, httpStatus, json: { error } };
}

Deno.test("publicação sem alterações: vai para o lote de vivos, sem erros nem remoções", () => {
  const plan = buildSyncPlan([live("a"), live("b"), live("c")], deps);
  assertEquals(plan.liveIds, ["a", "b", "c"]);
  assertEquals(plan.errorGroups, []);
  assertEquals(plan.removed, []);
  assertEquals(plan.connectionIssue, null);
  assertEquals(plan.details.map((d) => d.state), ["live", "live", "live"]);
});

Deno.test("alteração real de estado: objeto inexistente na Meta é marcado para remoção", () => {
  const gone = { code: 100, error_subcode: 33, message: "Unsupported get request. Object does not exist" };
  const plan = buildSyncPlan([errResult("x", gone)], deps);
  assertEquals(plan.liveIds, []);
  assertEquals(plan.removed.length, 1);
  assertEquals(plan.removed[0].post.id, "x");
  // Preserva os identificadores anteriores para raw_response.
  assertEquals(plan.removed[0].post.external_id, "ext-x");
  assertEquals(plan.removed[0].post.external_url, "https://facebook.com/x");
  assert(plan.removed[0].error.includes("Unsupported get request"));
  assertEquals(plan.details[0].state, "removed");
});

Deno.test("erro de sincronização desconhecido: grupo 'unknown' com mensagem formatada", () => {
  const weird = { code: 1, message: "An unexpected error occurred" };
  const plan = buildSyncPlan([errResult("u1", weird, 500)], deps);
  assertEquals(plan.removed, []);
  assertEquals(plan.errorGroups.length, 1);
  assertEquals(plan.errorGroups[0].kind, "unknown");
  assertEquals(plan.errorGroups[0].ids, ["u1"]);
  assert(plan.errorGroups[0].error.includes("HTTP 500"));
  assertEquals(plan.details[0].state, "unknown_error");
});

Deno.test("publicação removida por mensagem (sem código): detectada na mesma", () => {
  const gone = { message: "Media ID is not available" };
  const plan = buildSyncPlan([errResult("ig1", gone)], deps);
  assertEquals(plan.removed.length, 1);
  assertEquals(plan.removed[0].post.id, "ig1");
});

Deno.test("problema de ligação NUNCA remove; erros iguais agrupam-se numa só escrita", () => {
  const tokenExpired = { code: 190, error_subcode: 463, message: "Session has expired" };
  const rateLimited = { code: 613, message: "Calls too frequent" };
  const plan = buildSyncPlan(
    [errResult("c1", tokenExpired), errResult("c2", tokenExpired), errResult("c3", rateLimited)],
    deps,
  );
  assertEquals(plan.removed, []);
  assertEquals(plan.liveIds, []);
  // c1 e c2 partilham a mesma mensagem → um único grupo (uma única instrução UPDATE).
  assertEquals(plan.errorGroups.length, 2);
  const tokenGroup = plan.errorGroups.find((g) => g.ids.includes("c1"))!;
  assertEquals(tokenGroup.ids, ["c1", "c2"]);
  assertEquals(tokenGroup.kind, "connection");
  assertEquals(plan.connectionIssue, "token_expired");
  assertEquals(plan.details.map((d) => d.state), ["token_expired", "token_expired", "rate_limited"]);
});

Deno.test("resultados concorrentes/desactualizados: guarda rejeita verificações mais recentes", () => {
  const clause = staleGuardClause("2026-10-20T09:30:00.000Z");
  assertEquals(
    clause,
    "last_verified_at.is.null,last_verified_at.lt.2026-10-20T09:30:00.000Z",
  );
});

Deno.test("mistura completa: vivos, removidos, ligação e desconhecidos coexistem", () => {
  const gone = { code: 803, message: "Some of the aliases you requested do not exist" };
  const plan = buildSyncPlan(
    [
      live("ok1"),
      errResult("rm1", gone),
      errResult("err1", { code: 190, message: "Invalid OAuth access token" }),
      errResult("unk1", { message: "???" }, 502),
    ],
    deps,
  );
  assertEquals(plan.liveIds, ["ok1"]);
  assertEquals(plan.removed.map((r) => r.post.id), ["rm1"]);
  assertEquals(plan.errorGroups.length, 2);
  assertEquals(plan.connectionIssue, "token_invalid");
});
