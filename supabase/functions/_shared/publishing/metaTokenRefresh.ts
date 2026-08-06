// Cron-invoked token health check for the Meta connection.
// Renova automaticamente o long-lived user token e re-deriva o page token,
// para que a ligação nunca exija reconfiguração manual enquanto estiver válida.
import { GRAPH, graphJson, formatMetaError } from "../_shared/publishing/metaClient.ts";

const APP_ID = Deno.env.get("META_APP_ID");
const APP_SECRET = Deno.env.get("META_APP_SECRET");

export async function refreshMetaConnection(admin: any) {
  const { data: conn } = await admin
    .from("meta_connections")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (!conn) return { ok: true, skipped: "no active connection" };
  if (!APP_ID || !APP_SECRET) return { ok: false, error: "META_APP_ID / META_APP_SECRET em falta" };

  const patch: Record<string, unknown> = { last_checked_at: new Date().toISOString() };

  // 1. Extend the long-lived user token (Meta re-issues a fresh ~60d token).
  if (conn.user_access_token) {
    const { res, json } = await graphJson(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(APP_ID)}` +
        `&client_secret=${encodeURIComponent(APP_SECRET)}&fb_exchange_token=${encodeURIComponent(conn.user_access_token)}`,
    );
    if (res.ok && json?.access_token) {
      patch.user_access_token = json.access_token;
      if (json.expires_in) {
        patch.token_expires_at = new Date(Date.now() + Number(json.expires_in) * 1000).toISOString();
      }
    } else {
      patch.status = "expired";
      patch.last_error = `Renovação do token falhou: ${formatMetaError(json, res.status)}`;
      await admin.from("meta_connections").update(patch).eq("id", conn.id);
      return { ok: false, error: patch.last_error };
    }
  }

  // 2. Re-derive the page token + refresh page/Instagram metadata.
  if (conn.page_id) {
    const userToken = (patch.user_access_token as string) ?? conn.user_access_token;
    const { res, json: pageRow } = await graphJson(
      `${GRAPH}/${conn.page_id}?fields=id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}` +
        `&access_token=${encodeURIComponent(userToken)}`,
    );
    if (res.ok && pageRow?.access_token) {
      patch.page_name = pageRow.name;
      patch.page_picture_url = pageRow?.picture?.data?.url ?? null;
      patch.page_access_token = pageRow.access_token;
      patch.ig_user_id = pageRow?.instagram_business_account?.id ?? null;
      patch.ig_username = pageRow?.instagram_business_account?.username ?? null;
      patch.ig_profile_picture_url = pageRow?.instagram_business_account?.profile_picture_url ?? null;
      patch.status = "connected";
      patch.last_error = null;
    } else {
      // Página removida, sem permissões ou token inválido.
      patch.status = "expired";
      patch.page_access_token = null;
      patch.last_error = `Página inacessível: ${formatMetaError(pageRow, res.status)}`;
    }
  }

  await admin.from("meta_connections").update(patch).eq("id", conn.id);
  return { ok: patch.status !== "expired", status: patch.status ?? conn.status };
}

