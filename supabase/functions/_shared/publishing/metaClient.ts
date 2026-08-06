// Shared Meta (Graph API) helpers: explicit timeouts, error formatting and
// credential resolution (OAuth connection first, Supabase Secrets as fallback).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const GRAPH = "https://graph.facebook.com/v23.0";
export const GRAPH_TIMEOUT_MS = Number(Deno.env.get("META_GRAPH_TIMEOUT_MS") ?? "15000");

/** fetch with an explicit AbortController timeout (never blocks the function). */
export async function graphFetch(
  input: string,
  init: RequestInit = {},
  timeoutMs: number = GRAPH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Meta Graph API timeout após ${timeoutMs}ms: ${input.split("?")[0]}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** graphFetch + JSON parse in one step. */
export async function graphJson(
  input: string,
  init: RequestInit = {},
  timeoutMs: number = GRAPH_TIMEOUT_MS,
): Promise<{ res: Response; json: any }> {
  const res = await graphFetch(input, init, timeoutMs);
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export function formatMetaError(json: any, httpStatus: number): string {
  const e = json?.error;
  if (!e) return `HTTP ${httpStatus}`;
  const parts: string[] = [];
  if (e.message) parts.push(e.message);
  const codeBits: string[] = [];
  if (e.code !== undefined) codeBits.push(`code=${e.code}`);
  if (e.error_subcode !== undefined) codeBits.push(`subcode=${e.error_subcode}`);
  if (e.type) codeBits.push(`type=${e.type}`);
  if (e.fbtrace_id) codeBits.push(`trace=${e.fbtrace_id}`);
  if (codeBits.length) parts.push(`[${codeBits.join(" ")}]`);
  parts.push(`(HTTP ${httpStatus})`);
  return parts.join(" ");
}

export interface MetaCredentials {
  token: string | null;
  pageId: string | null;
  igUserId: string | null;
  source: "oauth" | "secrets" | "mixed" | "none";
}

/**
 * Resolves Meta credentials with this precedence:
 *   1. active OAuth connection (public.meta_connections)
 *   2. channel config (publishing_channels.config)
 *   3. Supabase Secrets (META_PAGE_ACCESS_TOKEN / META_PAGE_ID / META_IG_USER_ID)
 */
export async function resolveMetaCredentials(
  admin: ReturnType<typeof createClient>,
  channelConfig: Record<string, unknown> = {},
): Promise<MetaCredentials> {
  let oauth: any = null;
  try {
    const { data } = await admin
      .from("meta_connections")
      .select("page_id, ig_user_id, page_access_token, status, is_active")
      .eq("is_active", true)
      .eq("status", "connected")
      .maybeSingle();
    oauth = data ?? null;
  } catch (_) {
    oauth = null;
  }

  const token =
    (oauth?.page_access_token as string | undefined) ??
    Deno.env.get("META_PAGE_ACCESS_TOKEN") ??
    null;
  const pageId =
    (oauth?.page_id as string | undefined) ??
    (channelConfig?.page_id as string | undefined) ??
    Deno.env.get("META_PAGE_ID") ??
    null;
  const igUserId =
    (oauth?.ig_user_id as string | undefined) ??
    (channelConfig?.ig_user_id as string | undefined) ??
    Deno.env.get("META_IG_USER_ID") ??
    Deno.env.get("INSTAGRAM_USER_ID") ??
    null;

  const source: MetaCredentials["source"] = oauth?.page_access_token
    ? (oauth.page_id && oauth.ig_user_id ? "oauth" : "mixed")
    : token
      ? "secrets"
      : "none";

  return { token, pageId, igUserId, source };
}
