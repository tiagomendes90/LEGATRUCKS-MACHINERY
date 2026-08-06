// Admin-only API for the Meta (Facebook/Instagram) OAuth connection.
// Fase 2.6 — apenas infraestrutura de ligação. Não publica conteúdo.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GRAPH, graphJson, formatMetaError } from "../_shared/publishing/metaClient.ts";
import { refreshMetaConnection } from "../_shared/publishing/metaTokenRefresh.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const APP_ID = Deno.env.get("META_APP_ID")?.trim();
const APP_SECRET = Deno.env.get("META_APP_SECRET")?.trim();
// Facebook Login for Business: ID da configuração criada na App Meta.
// Quando definido, o diálogo usa `config_id` (as permissões vêm da configuração)
// em vez de enviar `scope`, que a Meta rejeita com "Invalid Scopes".
const LOGIN_CONFIG_ID = Deno.env.get("META_LOGIN_CONFIG_ID");
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`;

const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "business_management",
  "instagram_basic",
  "instagram_content_publish",
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await anon.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !data?.claims?.sub) return null;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.claims.sub)
    .maybeSingle();
  if (profile?.role !== "admin") return null;
  return { userId: data.claims.sub as string, admin };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = await requireAdmin(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { admin, userId } = auth;

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "status");

    const { data: conn } = await admin
      .from("meta_connections")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const safe = (c: any) =>
      c && {
        id: c.id,
        status: c.status,
        page_id: c.page_id,
        page_name: c.page_name,
        page_picture_url: c.page_picture_url,
        ig_user_id: c.ig_user_id,
        ig_username: c.ig_username,
        ig_profile_picture_url: c.ig_profile_picture_url,
        token_expires_at: c.token_expires_at,
        has_page_token: !!c.page_access_token,
        scopes: c.scopes,
        connected_at: c.connected_at,
        last_checked_at: c.last_checked_at,
        last_error: c.last_error,
      };

    // ---------- STATUS ----------
    if (action === "status") {
      return json({
        configured: !!(APP_ID && APP_SECRET),
        login_config_id: LOGIN_CONFIG_ID ?? null,
        redirect_uri: REDIRECT_URI,
        required_scopes: SCOPES,
        connection: safe(conn) ?? null,
      });
    }

    // ---------- OAUTH URL ----------
    // ---------- DIAGNOSE ----------
    if (action === "diagnose") {
      const userToken = conn?.user_access_token as string | undefined;
      if (!userToken) return json({ error: "Sem sessão Meta (user_access_token ausente)." }, 400);
      if (!APP_ID || !APP_SECRET) return json({ error: "App Meta não configurada." }, 400);

      const appToken = `${APP_ID}|${APP_SECRET}`;

      // 1. Identidade e tipo do token guardado
      const { res: dbgRes, json: dbg } = await graphJson(
        `${GRAPH}/debug_token?input_token=${encodeURIComponent(userToken)}&access_token=${encodeURIComponent(appToken)}`,
      );
      const d = dbg?.data ?? {};

      // 2. Quem é o /me deste token
      const { res: meRes, json: me } = await graphJson(
        `${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(userToken)}`,
      );

      // 3. /me/accounts cru + cabeçalhos de diagnóstico
      const accUrl = `${GRAPH}/me/accounts?fields=id,name,tasks,access_token&limit=100&access_token=${encodeURIComponent(userToken)}`;
      const { res: accRes, json: acc } = await graphJson(accUrl);
      const headerKeys = ["x-fb-trace-id", "x-fb-rev", "x-app-usage", "www-authenticate", "x-business-use-case-usage"];
      const accHeaders: Record<string, string | null> = {};
      for (const k of headerKeys) accHeaders[k] = accRes.headers.get(k);

      // 4. Páginas via portfolio (client_pages/owned_pages) quando existe business_management
      const { res: bizRes, json: biz } = await graphJson(
        `${GRAPH}/me/businesses?fields=id,name&limit=25&access_token=${encodeURIComponent(userToken)}`,
      );
      const businessPages: any[] = [];
      if (Array.isArray(biz?.data)) {
        for (const b of biz.data) {
          for (const edge of ["owned_pages", "client_pages"]) {
            const { json: bp } = await graphJson(
              `${GRAPH}/${b.id}/${edge}?fields=id,name&limit=50&access_token=${encodeURIComponent(userToken)}`,
            );
            businessPages.push({
              business_id: b.id,
              business_name: b.name,
              edge,
              pages: Array.isArray(bp?.data) ? bp.data.map((p: any) => ({ id: p.id, name: p.name })) : null,
              error: bp?.error ? { code: bp.error.code, message: bp.error.message } : null,
            });
          }
        }
      }

      // 5. Permissões concedidas/recusadas
      const { json: perms } = await graphJson(
        `${GRAPH}/me/permissions?access_token=${encodeURIComponent(userToken)}`,
      );

      return json({
        stored_connection: {
          id: conn.id,
          status: conn.status,
          scopes: conn.scopes,
          connected_at: conn.connected_at,
          has_page_token: !!conn.page_access_token,
        },
        token_debug: {
          http_status: dbgRes.status,
          app_id: d.app_id ?? null,
          app_id_matches_env: d.app_id ? String(d.app_id) === String(APP_ID) : null,
          application: d.application ?? null,
          type: d.type ?? null, // USER | PAGE | APP
          user_id: d.user_id ?? null,
          profile_id: d.profile_id ?? null,
          is_valid: d.is_valid ?? null,
          issued_at: d.issued_at ? new Date(d.issued_at * 1000).toISOString() : null,
          expires_at: d.expires_at ? new Date(d.expires_at * 1000).toISOString() : "never",
          data_access_expires_at: d.data_access_expires_at
            ? new Date(d.data_access_expires_at * 1000).toISOString()
            : null,
          scopes: d.scopes ?? null,
          granular_scopes: d.granular_scopes ?? null,
          error: dbg?.error ?? null,
        },
        me: {
          http_status: meRes.status,
          id: me?.id ?? null,
          name: me?.name ?? null,
          matches_token_user_id: me?.id && d.user_id ? String(me.id) === String(d.user_id) : null,
          error: me?.error ?? null,
        },
        me_accounts: {
          http_status: accRes.status,
          headers: accHeaders,
          has_data_key: Object.prototype.hasOwnProperty.call(acc ?? {}, "data"),
          count: Array.isArray(acc?.data) ? acc.data.length : null,
          pages: Array.isArray(acc?.data)
            ? acc.data.map((p: any) => ({ id: p.id, name: p.name, tasks: p.tasks ?? null }))
            : null,
          paging: acc?.paging ?? null,
          error: acc?.error ?? null,
        },
        businesses: {
          http_status: bizRes.status,
          count: Array.isArray(biz?.data) ? biz.data.length : null,
          list: Array.isArray(biz?.data) ? biz.data.map((b: any) => ({ id: b.id, name: b.name })) : null,
          error: biz?.error ?? null,
        },
        business_pages: businessPages,
        permissions: perms?.data ?? perms?.error ?? null,
      });
    }

    // ---------- VERIFY CREDENTIALS ----------
    if (action === "verify_credentials") {
      if (!APP_ID || !APP_SECRET) return json({ ok: false, error: "Credenciais em falta" }, 400);
      const { res, json: data } = await graphJson(
        `${GRAPH}/oauth/access_token?client_id=${encodeURIComponent(APP_ID)}` +
          `&client_secret=${encodeURIComponent(APP_SECRET)}&grant_type=client_credentials`,
      );
      return json({
        ok: res.ok,
        app_id: APP_ID,
        app_id_length: APP_ID.length,
        secret_length: APP_SECRET.length,
        error: res.ok ? null : formatMetaError(data),
      });
    }

    if (action === "oauth_url") {
      if (!APP_ID || !APP_SECRET) {
        return json(
          { error: "META_APP_ID / META_APP_SECRET não configurados nos Supabase Secrets." },
          400,
        );
      }
      const state = crypto.randomUUID();
      await admin.from("meta_oauth_states").insert({
        state,
        created_by: userId,
        redirect_to: body?.redirect_to ?? null,
      });
      const params = new URLSearchParams({
        client_id: APP_ID,
        redirect_uri: REDIRECT_URI,
        state,
        response_type: "code",
        // Força a Meta a reapresentar o ecrã de autorização / seleção de Páginas
        // em vez de reutilizar silenciosamente a autorização anterior.
        auth_type: "rerequest",
      });
      if (LOGIN_CONFIG_ID) {
        // Facebook Login for Business — permissões definidas na configuração
        params.set("config_id", LOGIN_CONFIG_ID);
        // Necessário para que o fluxo com config_id devolva `code` (e não token).
        params.set("override_default_response_type", "true");
      } else {
        // Facebook Login clássico — permissões pedidas explicitamente
        params.set("scope", SCOPES.join(","));
      }
      const url = `https://www.facebook.com/v23.0/dialog/oauth?${params.toString()}`;
      console.log("[meta-connection] oauth_url", {
        flow: LOGIN_CONFIG_ID ? "business_login" : "classic",
        auth_type: "rerequest",
        redirect_uri: REDIRECT_URI,
      });
      return json({ url, state });
    }

    // ---------- LIST PAGES (with linked IG business account) ----------
    if (action === "pages") {
      const userToken = conn?.user_access_token;
      if (!userToken) {
        return json({
          pages: [],
          reason: "no_session",
          error: "Sem sessão Meta. Liga a conta primeiro.",
        });
      }
      const { res, json: data } = await graphJson(
        `${GRAPH}/me/accounts?fields=id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}&limit=100&access_token=${encodeURIComponent(userToken)}`,
      );
      // Diagnóstico interno (sem tokens nem dados sensíveis)
      console.log("[meta-connection] /me/accounts", {
        http_status: res.status,
        has_data_key: Object.prototype.hasOwnProperty.call(data ?? {}, "data"),
        pages_count: Array.isArray(data?.data) ? data.data.length : null,
        page_ids: Array.isArray(data?.data) ? data.data.map((p: any) => p.id) : null,
        page_names: Array.isArray(data?.data) ? data.data.map((p: any) => p.name) : null,
        meta_error: data?.error
          ? {
              code: data.error.code,
              subcode: data.error.error_subcode,
              type: data.error.type,
              message: data.error.message,
            }
          : null,
        granted_scopes: conn?.scopes ?? null,
      });

      if (!res.ok || data?.error) {
        const message = formatMetaError(data, res.status);
        await admin
          .from("meta_connections")
          .update({ last_error: message, last_checked_at: new Date().toISOString() })
          .eq("id", conn.id);
        return json({ pages: [], reason: "graph_error", error: message });
      }

      if (!Array.isArray(data?.data)) {
        return json({
          pages: [],
          reason: "empty_response",
          error:
            "A Meta respondeu sem a lista de Páginas (resposta vazia ou inesperada). Tenta novamente dentro de instantes.",
        });
      }

      const pages = data.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        picture_url: p?.picture?.data?.url ?? null,
        ig_user_id: p?.instagram_business_account?.id ?? null,
        ig_username: p?.instagram_business_account?.username ?? null,
        ig_profile_picture_url: p?.instagram_business_account?.profile_picture_url ?? null,
      }));
      if (pages.length === 0) {
        const scopes: string[] = conn?.scopes ?? [];
        if (!scopes.includes("pages_show_list")) {
          const message =
            "A autorização Meta não inclui a permissão pages_show_list, por isso nenhuma Página pode ser listada. Adiciona-a na configuração de Business Login e volta a ligar a conta.";
          await admin
            .from("meta_connections")
            .update({ status: "no_pages_available", last_error: message, last_checked_at: new Date().toISOString() })
            .eq("id", conn.id);
          return json({ pages, reason: "missing_scope", error: message });
        }

        // Distingue "sem acesso a Páginas" de "nenhuma Página selecionada no login".
        const { res: bizRes, json: biz } = await graphJson(
          `${GRAPH}/me/businesses?limit=25&access_token=${encodeURIComponent(userToken)}`,
        );
        const businessCount = Array.isArray(biz?.data) ? biz.data.length : null;
        console.log("[meta-connection] /me/businesses", {
          http_status: bizRes.status,
          business_count: businessCount,
          meta_error: biz?.error ? { code: biz.error.code, message: biz.error.message } : null,
        });

        // Só se pode afirmar "sem acesso a Páginas" quando a consulta de portfolios
        // responde mesmo (exige business_management). Se falhar (null), é indeterminado.
        const reason = businessCount === 0 ? "no_page_access" : "no_pages_selected";
        const message =
          reason === "no_page_access"
            ? "O utilizador autenticado não tem acesso total a nenhuma Página do Facebook. Pede acesso total à Página LEGA no Business Manager e depois volta a ligar a conta Meta."
            : "Nenhuma Página foi autorizada durante o login Meta. Ao reconectar, no ecrã da Meta escolhe o Business Portfolio da LEGA e marca explicitamente a Página LEGA antes de continuar.";

        await admin
          .from("meta_connections")
          .update({
            status: "no_pages_available",
            last_error: message,
            last_checked_at: new Date().toISOString(),
            metadata: { pages_count: 0, reason, business_count: businessCount },
          })
          .eq("id", conn.id);
        return json({ pages, reason, error: message });
      }
      await admin
        .from("meta_connections")
        .update({ last_error: null, last_checked_at: new Date().toISOString() })
        .eq("id", conn.id);
      return json({ pages });
    }

    // ---------- SELECT PAGE ----------
    if (action === "select_page") {
      const pageId = String(body?.page_id ?? "");
      if (!pageId) return json({ error: "page_id em falta" }, 400);
      const userToken = conn?.user_access_token;
      if (!userToken) return json({ error: "Sem sessão Meta. Liga a conta primeiro." }, 400);

      const { res, json: page } = await graphJson(
        `${GRAPH}/${pageId}?fields=id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}&access_token=${encodeURIComponent(userToken)}`,
      );
      if (!res.ok || !page?.access_token) {
        return json({ error: formatMetaError(page, res.status), details: page }, 400);
      }

      // Page tokens derived from a long-lived user token are long-lived.
      let expiresAt: string | null = null;
      const { res: dbgRes, json: dbg } = await graphJson(
        `${GRAPH}/debug_token?input_token=${encodeURIComponent(page.access_token)}&access_token=${encodeURIComponent(APP_ID + "|" + APP_SECRET)}`,
      );
      if (dbgRes.ok && dbg?.data?.expires_at) {
        expiresAt = dbg.data.expires_at === 0
          ? null
          : new Date(dbg.data.expires_at * 1000).toISOString();
      }

      const { error } = await admin
        .from("meta_connections")
        .update({
          page_id: page.id,
          page_name: page.name,
          page_picture_url: page?.picture?.data?.url ?? null,
          page_access_token: page.access_token,
          ig_user_id: page?.instagram_business_account?.id ?? null,
          ig_username: page?.instagram_business_account?.username ?? null,
          ig_profile_picture_url: page?.instagram_business_account?.profile_picture_url ?? null,
          token_expires_at: expiresAt,
          status: "connected",
          last_checked_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", conn.id);
      if (error) return json({ error: error.message }, 400);

      const { data: updated } = await admin
        .from("meta_connections")
        .select("*")
        .eq("id", conn.id)
        .maybeSingle();
      return json({ ok: true, connection: safe(updated) });
    }

    // ---------- VERIFY ----------
    if (action === "verify") {
      if (!conn?.page_access_token) return json({ error: "Nenhuma ligação ativa." }, 400);
      if (!APP_ID || !APP_SECRET) return json({ error: "App Meta não configurada." }, 400);
      const { res, json: dbg } = await graphJson(
        `${GRAPH}/debug_token?input_token=${encodeURIComponent(conn.page_access_token)}&access_token=${encodeURIComponent(APP_ID + "|" + APP_SECRET)}`,
      );
      const valid = !!dbg?.data?.is_valid && res.ok;
      await admin
        .from("meta_connections")
        .update({
          status: valid ? "connected" : "expired",
          last_checked_at: new Date().toISOString(),
          last_error: valid ? null : formatMetaError(dbg, res.status),
          token_expires_at: dbg?.data?.expires_at
            ? new Date(dbg.data.expires_at * 1000).toISOString()
            : conn.token_expires_at,
          scopes: dbg?.data?.scopes ?? conn.scopes,
        })
        .eq("id", conn.id);
      return json({ ok: valid, debug: dbg?.data ?? null });
    }

    // ---------- REFRESH (renovar ligação sem novo OAuth) ----------
    if (action === "refresh") {
      if (!conn) return json({ error: "Nenhuma ligação ativa." }, 400);
      const result = await refreshMetaConnection(admin);
      const { data: updated } = await admin
        .from("meta_connections")
        .select("*")
        .eq("id", conn.id)
        .maybeSingle();
      return json({ ...result, connection: safe(updated) });
    }

    // ---------- DISCONNECT ----------
    if (action === "disconnect") {
      if (!conn) return json({ ok: true });
      await admin
        .from("meta_connections")
        .update({
          is_active: false,
          status: "disconnected",
          page_access_token: null,
          user_access_token: null,
          ig_user_id: null,
          ig_username: null,
          ig_profile_picture_url: null,
          last_error: null,
        })
        .eq("id", conn.id);
      return json({ ok: true });
    }

    return json({ error: `Ação desconhecida: ${action}` }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
