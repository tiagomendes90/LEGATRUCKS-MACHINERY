// Reconciliação entre a plataforma e a Meta (Facebook + Instagram).
// Verifica, para cada post marcado como publicado, se o conteúdo ainda existe
// na Graph API. Se tiver sido removido (pelo utilizador, por um admin da página
// ou pela própria Meta), marca o post como 'removed', limpa os identificadores
// externos e devolve o produto ao estado 'ready_for_social' para poder ser
// publicado de novo — sem intervenção manual na base de dados.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GRAPH, graphJson, formatMetaError, resolveMetaCredentials } from "../_shared/publishing/metaClient.ts";
import { syncProductSocialStatus } from "../_shared/publishing/socialStatus.ts";
import { isGoneError, classifyConnectionProblem } from "../_shared/publishing/socialDelete.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CRON_SECRET = Deno.env.get("SOCIAL_SYNC_CRON_SECRET");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

const isGone = isGoneError;
const isConnectionProblem = classifyConnectionProblem;

async function requireAuth(req: Request): Promise<boolean> {
  const cron = req.headers.get("x-cron-secret");
  if (CRON_SECRET && cron && cron === CRON_SECRET) return true;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await anon.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !data?.claims?.sub) return false;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.claims.sub)
    .maybeSingle();
  return profile?.role === "admin";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!(await requireAuth(req))) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const productId: string | null = body?.product_id ?? null;
    const limit = Math.min(Number(body?.limit ?? 100), 300);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: channels } = await admin
      .from("publishing_channels")
      .select("key, config")
      .in("key", ["facebook", "instagram"]);
    const configOf = (k: string) =>
      ((channels ?? []).find((c: any) => c.key === k)?.config ?? {}) as Record<string, unknown>;

    const creds = await resolveMetaCredentials(admin, {
      ...configOf("facebook"),
      ...configOf("instagram"),
    });

    if (!creds.token) {
      await admin
        .from("meta_connections")
        .update({
          status: "disconnected",
          last_error: "Sem token de página disponível.",
          last_checked_at: new Date().toISOString(),
        })
        .eq("is_active", true);
      return json({
        ok: false,
        reason: "missing_credentials",
        message: "Sem credenciais Meta ativas — ligue a conta no painel para sincronizar.",
        checked: 0,
        removed: 0,
      });
    }

    let query = admin
      .from("product_social_posts")
      .select("id, product_id, channel_key, external_id, external_url, status")
      .in("channel_key", ["facebook", "instagram"])
      .in("status", ["published", "live"])
      .not("external_id", "is", null)
      .order("published_at", { ascending: true })
      .limit(limit);
    if (productId) query = query.eq("product_id", productId);

    const { data: posts, error } = await query;
    if (error) throw error;

    const now = new Date().toISOString();
    let removed = 0;
    let connectionIssue: string | null = null;
    const touchedProducts = new Set<string>();
    const details: any[] = [];

    const results = await Promise.all(
      (posts ?? []).map(async (post: any) => {
        const fields = post.channel_key === "instagram" ? "id,permalink" : "id,permalink_url";
        const { res, json: j } = await graphJson(
          `${GRAPH}/${encodeURIComponent(post.external_id)}?fields=${fields}&access_token=${encodeURIComponent(creds.token!)}`,
        );
        return { post, res, j };
      }),
    );

    for (const { post, res, j } of results) {
      if (res.ok && j?.id) {
        await admin
          .from("product_social_posts")
          .update({ last_verified_at: now, verification_error: null })
          .eq("id", post.id);
        details.push({ post_id: post.id, channel: post.channel_key, state: "live" });
        continue;
      }

      const err = j?.error;
      const conn = isConnectionProblem(err);
      if (conn.problem) {
        connectionIssue = conn.kind ?? "connection_error";
        await admin
          .from("product_social_posts")
          .update({ last_verified_at: now, verification_error: formatMetaError(j, res.status) })
          .eq("id", post.id);
        details.push({ post_id: post.id, channel: post.channel_key, state: conn.kind });
        continue;
      }

      if (isGone(err)) {
        await admin
          .from("product_social_posts")
          .update({
            status: "removed",
            external_id: null,
            external_url: null,
            last_verified_at: now,
            verification_error: formatMetaError(j, res.status),
            raw_response: {
              removed_detected_at: now,
              previous_external_id: post.external_id,
              previous_external_url: post.external_url,
              meta_error: err ?? null,
            },
          })
          .eq("id", post.id);
        if (post.product_id) touchedProducts.add(post.product_id);
        removed++;
        details.push({ post_id: post.id, channel: post.channel_key, state: "removed" });
        continue;
      }

      await admin
        .from("product_social_posts")
        .update({ last_verified_at: now, verification_error: formatMetaError(j, res.status) })
        .eq("id", post.id);
      details.push({ post_id: post.id, channel: post.channel_key, state: "unknown_error" });
    }

    for (const pid of touchedProducts) {
      await syncProductSocialStatus(admin, pid);
    }

    await admin
      .from("meta_connections")
      .update({
        last_checked_at: now,
        ...(connectionIssue
          ? {
              status: connectionIssue === "rate_limited" ? "connected" : "error",
              last_error: connectionIssue,
            }
          : { status: "connected", last_error: null }),
      })
      .eq("is_active", true);

    return json({
      ok: true,
      checked: posts?.length ?? 0,
      removed,
      products_updated: [...touchedProducts],
      connection_issue: connectionIssue,
      credentials_source: creds.source,
      details,
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
