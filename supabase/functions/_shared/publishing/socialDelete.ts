// Fonte única de verdade para eliminar publicações sociais (Facebook / Instagram).
// Reutilizada pelos adapters (social.delete e republish com delete_previous) e
// pela reconciliação social-sync (classificação de erros da Graph API).
import { GRAPH, graphJson, formatMetaError } from "./metaClient.ts";
import { syncProductSocialStatus } from "./socialStatus.ts";
import type { ChannelResult } from "./types.ts";

/** Erros da Graph API que significam "este objeto já não existe". */
export function isGoneError(err: any): boolean {
  if (!err) return false;
  const code = Number(err.code);
  const sub = Number(err.error_subcode);
  const msg = String(err.message ?? "").toLowerCase();
  if (code === 803) return true;
  if (code === 100 && (sub === 33 || sub === 21)) return true;
  return (
    msg.includes("unsupported get request") ||
    msg.includes("unknown object") ||
    msg.includes("object does not exist") ||
    msg.includes("object not found") ||
    msg.includes("media id is not available") ||
    msg.includes("no longer exists")
  );
}

/** Erros de ligação/permissões — nunca significam que o post foi removido. */
export function classifyConnectionProblem(err: any): { problem: boolean; kind?: string } {
  if (!err) return { problem: false };
  const code = Number(err.code);
  const sub = Number(err.error_subcode);
  if (code === 190) {
    if (sub === 463 || sub === 467) return { problem: true, kind: "token_expired" };
    return { problem: true, kind: "token_invalid" };
  }
  if (code === 200 || code === 10 || code === 3 || code === 299) {
    return { problem: true, kind: "missing_permissions" };
  }
  if (code === 4 || code === 17 || code === 32 || code === 613) {
    return { problem: true, kind: "rate_limited" };
  }
  return { problem: false };
}

const CONNECTION_MESSAGES: Record<string, string> = {
  token_expired:
    "A ligação à Meta expirou. Volte a ligar a conta no painel e tente eliminar novamente.",
  token_invalid:
    "O token da Meta é inválido. Volte a ligar a conta no painel e tente eliminar novamente.",
  missing_permissions:
    "Faltam permissões na Meta para eliminar esta publicação (pages_manage_posts / instagram_content_publish).",
  rate_limited:
    "A Meta está a limitar os pedidos (rate limit). Tente eliminar novamente dentro de alguns minutos.",
};

/** A Graph API não suporta eliminar media do Instagram. */
function isUnsupportedDelete(err: any): boolean {
  const msg = String(err?.message ?? "").toLowerCase();
  return (
    msg.includes("unsupported delete request") ||
    msg.includes("does not support this operation") ||
    msg.includes("nonexisting field") ||
    msg.includes("cannot be deleted")
  );
}

async function markLocalRemoved(
  admin: any,
  productId: string,
  channelKey: string,
  externalId: string | null,
  extra: Record<string, unknown> = {},
) {
  const now = new Date().toISOString();
  let q = admin
    .from("product_social_posts")
    .update({
      status: "removed",
      external_id: null,
      external_url: null,
      last_verified_at: now,
      updated_at: now,
      raw_response: { removed_detected_at: now, previous_external_id: externalId, ...extra },
    })
    .eq("product_id", productId)
    .eq("channel_key", channelKey)
    .in("status", ["published", "live"]);
  if (externalId) q = q.eq("external_id", externalId);
  await q;
}

export interface DeleteSocialPostArgs {
  admin: any;
  token: string;
  channelKey: string;
  productId: string;
  /** Se omitido, usa o último post publicado deste canal. */
  externalId?: string | null;
}

/** Último external_id publicado num canal. */
export async function loadLatestExternalId(
  admin: any,
  productId: string,
  channelKey: string,
): Promise<string | null> {
  const { data } = await admin
    .from("product_social_posts")
    .select("external_id")
    .eq("product_id", productId)
    .eq("channel_key", channelKey)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.external_id as string | null) ?? null;
}

/**
 * Elimina uma publicação na Meta e mantém a BD consistente em TODOS os cenários:
 *  • sem post local            → success (nada a fazer, estado sincronizado)
 *  • post já removido na Meta  → success (marca removido localmente)
 *  • token/permissões/rate     → failed com mensagem clara, BD intacta
 *  • operação não suportada    → failed com instrução de remoção manual
 *  • falha de rede/timeout     → failed, BD intacta (pode repetir)
 */
export async function deleteSocialPost({
  admin,
  token,
  channelKey,
  productId,
  externalId,
}: DeleteSocialPostArgs): Promise<ChannelResult> {
  const targetId = externalId ?? (await loadLatestExternalId(admin, productId, channelKey));

  if (!targetId) {
    // Nada publicado (ou já eliminado): garante coerência do estado do produto.
    await markLocalRemoved(admin, productId, channelKey, null, { reason: "no_external_id" });
    const status = await syncProductSocialStatus(admin, productId);
    return {
      status: "success",
      request: { action: "delete", channel: channelKey },
      response: { reason: "no_external_id", already_absent: true, product_status: status },
    };
  }

  let res: Response;
  let json: any;
  try {
    ({ res, json } = await graphJson(
      `${GRAPH}/${encodeURIComponent(targetId)}?access_token=${encodeURIComponent(token)}`,
      { method: "DELETE" },
    ));
  } catch (err) {
    return {
      status: "failed",
      request: { action: "delete", channel: channelKey, external_id: targetId },
      error: `Falha de comunicação com a Meta: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }

  const metaError = json?.error;

  if (!res.ok) {
    const conn = classifyConnectionProblem(metaError);
    if (conn.problem) {
      return {
        status: "failed",
        request: { action: "delete", channel: channelKey, external_id: targetId },
        response: json,
        error: `${CONNECTION_MESSAGES[conn.kind ?? ""] ?? "Erro de ligação à Meta."} ${formatMetaError(
          json,
          res.status,
        )}`,
      };
    }

    if (isGoneError(metaError)) {
      // Já não existe na Meta (eliminado manualmente): sincroniza a BD.
      await markLocalRemoved(admin, productId, channelKey, targetId, { meta_error: metaError });
      const status = await syncProductSocialStatus(admin, productId);
      return {
        status: "success",
        request: { action: "delete", channel: channelKey, external_id: targetId },
        response: { already_deleted: true, meta_error: metaError, product_status: status },
      };
    }

    if (isUnsupportedDelete(metaError)) {
      return {
        status: "failed",
        request: { action: "delete", channel: channelKey, external_id: targetId },
        response: json,
        error:
          channelKey === "instagram"
            ? "A API do Instagram não permite eliminar esta publicação. Remova-a na app do Instagram e use 'Sincronizar com a Meta' para atualizar o estado."
            : `A Meta não permite eliminar este conteúdo: ${formatMetaError(json, res.status)}`,
      };
    }

    return {
      status: "failed",
      request: { action: "delete", channel: channelKey, external_id: targetId },
      response: json,
      error: formatMetaError(json, res.status),
    };
  }

  await markLocalRemoved(admin, productId, channelKey, targetId, { deleted_via: "admin" });
  const status = await syncProductSocialStatus(admin, productId);
  return {
    status: "success",
    request: { action: "delete", channel: channelKey, external_id: targetId },
    response: { ...json, product_status: status },
  };
}
