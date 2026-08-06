// Public OAuth callback for the Meta connection. Validates the one-time state,
// exchanges the code for a long-lived user token and stores the connection.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GRAPH, graphJson, formatMetaError } from "../_shared/publishing/metaClient.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_ID = Deno.env.get("META_APP_ID")?.trim();
const APP_SECRET = Deno.env.get("META_APP_SECRET")?.trim();
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`;

function page(title: string, message: string, ok: boolean) {
  return new Response(
    `<!doctype html><html lang="pt"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center;max-width:520px;padding:32px">
<div style="font-size:44px">${ok ? "✅" : "⚠️"}</div>
<h1 style="font-size:20px;margin:12px 0">${title}</h1>
<p style="color:#94a3b8;line-height:1.5">${message}</p>
<p style="color:#64748b;font-size:13px">Podes fechar esta janela.</p>
</div>
<script>try{window.opener&&window.opener.postMessage({type:"meta-oauth",ok:${ok}},"*");setTimeout(function(){window.close()},1500)}catch(e){}</script>
</body></html>`,
    { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorDesc = url.searchParams.get("error_description");

  if (errorDesc) return page("Ligação cancelada", errorDesc, false);
  if (!code || !state) return page("Pedido inválido", "Faltam parâmetros code/state.", false);
  if (!APP_ID || !APP_SECRET) {
    return page("App Meta não configurada", "Define META_APP_ID e META_APP_SECRET.", false);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: stateRow } = await admin
    .from("meta_oauth_states")
    .select("*")
    .eq("state", state)
    .maybeSingle();
  if (!stateRow || new Date(stateRow.expires_at) < new Date()) {
    return page("Sessão expirada", "O pedido de ligação expirou. Tenta novamente.", false);
  }
  await admin.from("meta_oauth_states").delete().eq("state", state);

  try {
    // 1. short-lived user token
    const { res: tRes, json: tJson } = await graphJson(
      `${GRAPH}/oauth/access_token?client_id=${encodeURIComponent(APP_ID)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&client_secret=${encodeURIComponent(APP_SECRET)}&code=${encodeURIComponent(code)}`,
    );
    if (!tRes.ok || !tJson?.access_token) {
      return page("Falha na autenticação", formatMetaError(tJson, tRes.status), false);
    }

    // 2. exchange for long-lived user token (~60 dias)
    const { res: llRes, json: llJson } = await graphJson(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(APP_ID)}` +
        `&client_secret=${encodeURIComponent(APP_SECRET)}&fb_exchange_token=${encodeURIComponent(tJson.access_token)}`,
    );
    const userToken = llRes.ok && llJson?.access_token ? llJson.access_token : tJson.access_token;
    const expiresAt = llJson?.expires_in
      ? new Date(Date.now() + Number(llJson.expires_in) * 1000).toISOString()
      : null;

    // 3. scopes + first page (auto-selection when there is only one)
    const { json: permJson } = await graphJson(
      `${GRAPH}/me/permissions?access_token=${encodeURIComponent(userToken)}`,
    );
    const scopes = (permJson?.data ?? [])
      .filter((p: any) => p.status === "granted")
      .map((p: any) => p.permission);

    const { json: pagesJson } = await graphJson(
      `${GRAPH}/me/accounts?fields=id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}&limit=100&access_token=${encodeURIComponent(userToken)}`,
    );
    const pages = pagesJson?.data ?? [];
    const only = pages.length === 1 ? pages[0] : null;
    const noPagesMessage = pages.length === 0
      ? "A Meta autenticou a conta, mas não disponibilizou nenhuma Página. Confirma que o teu utilizador tem acesso total à Página LEGA e, ao reconectar, seleciona explicitamente essa Página na janela da Meta."
      : null;

    // deactivate previous connections, then insert the new one
    await admin
      .from("meta_connections")
      .update({ is_active: false, status: "replaced" })
      .eq("is_active", true);

    await admin.from("meta_connections").insert({
      provider: "meta",
      status: only ? "connected" : pages.length === 0 ? "no_pages_available" : "pending_page_selection",
      user_access_token: userToken,
      token_expires_at: expiresAt,
      scopes,
      connected_by: stateRow.created_by,
      page_id: only?.id ?? null,
      page_name: only?.name ?? null,
      page_picture_url: only?.picture?.data?.url ?? null,
      page_access_token: only?.access_token ?? null,
      ig_user_id: only?.instagram_business_account?.id ?? null,
      ig_username: only?.instagram_business_account?.username ?? null,
      ig_profile_picture_url: only?.instagram_business_account?.profile_picture_url ?? null,
      metadata: { pages_count: pages.length },
      last_error: noPagesMessage,
      is_active: true,
    });

    return page(
      "Conta Meta ligada",
      only
        ? `Página “${only.name}” ligada${only?.instagram_business_account?.username ? ` e Instagram @${only.instagram_business_account.username} detetado` : " (sem conta Instagram Business associada)"}.`
        : noPagesMessage ?? "Autenticação concluída. Escolhe agora a Página no painel de administração.",
      pages.length > 0,
    );
  } catch (err) {
    return page("Erro inesperado", err instanceof Error ? err.message : String(err), false);
  }
});
