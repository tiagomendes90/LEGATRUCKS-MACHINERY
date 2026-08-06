// Admin-only API for the Meta (Facebook/Instagram) OAuth connection.
// Fase 2.6 — apenas infraestrutura de ligação. Não publica conteúdo.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GRAPH, graphJson, formatMetaError } from "../_shared/publishing/metaClient.ts";
import { refreshMetaConnection } from "../meta-token-refresh/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const APP_ID = Deno.env.get("META_APP_ID");
const APP_SECRET = Deno.env.get("META_APP_SECRET");
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
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        redirect_uri: REDIRECT_URI,
        required_scopes: SCOPES,
        connection: safe(conn) ?? null,
      });
    }

    // ---------- OAUTH URL ----------
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
      const url =
        `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(APP_ID)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&state=${state}&response_type=code&scope=${encodeURIComponent(SCOPES.join(","))}`;
      return json({ url, state });
    }

    // ---------- LIST PAGES (with linked IG business account) ----------
    if (action === "pages") {
      const userToken = conn?.user_access_token;
      if (!userToken) return json({ error: "Sem sessão Meta. Liga a conta primeiro." }, 400);
      const { res, json: data } = await graphJson(
        `${GRAPH}/me/accounts?fields=id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}&limit=100&access_token=${encodeURIComponent(userToken)}`,
      );
      if (!res.ok) return json({ error: formatMetaError(data, res.status), details: data }, 400);
      const pages = (data?.data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        picture_url: p?.picture?.data?.url ?? null,
        ig_user_id: p?.instagram_business_account?.id ?? null,
        ig_username: p?.instagram_business_account?.username ?? null,
        ig_profile_picture_url: p?.instagram_business_account?.profile_picture_url ?? null,
      }));
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
