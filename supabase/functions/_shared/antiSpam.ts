// Shared anti-spam helpers used by every form submission edge function.
// Centralizing this guarantees a single source of truth — adding a new form
// never duplicates Turnstile / honeypot / timing logic.

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const MIN_ELAPSED_MS = 1500;

export interface AntiSpamPayload {
  turnstileToken?: string;
  honeypot?: string;
  elapsedMs?: number;
}

export type AntiSpamResult =
  | { ok: true }
  | { ok: false; status: number; error: string; reason?: string }
  | { skipped: true };

async function verifyTurnstile(token: string, remoteip: string | null) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return { ok: false, reason: "secret_missing" };
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (remoteip) form.append("remoteip", remoteip);
  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    const data = await res.json();
    return {
      ok: !!data.success,
      reason: data.success
        ? "ok"
        : (data["error-codes"] || []).join(",") || "invalid",
    };
  } catch (_e) {
    return { ok: false, reason: "network" };
  }
}

export function getRemoteIp(req: Request): string | null {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  );
}

/**
 * Runs the full anti-spam pipeline. Returns either `{ ok: true }` (proceed),
 * `{ skipped: true }` (honeypot tripped — caller should pretend success), or
 * `{ ok: false, status, error }` (caller should return that response).
 */
export async function runAntiSpam(
  req: Request,
  payload: AntiSpamPayload,
): Promise<AntiSpamResult> {
  if (payload.honeypot && payload.honeypot.trim().length > 0) {
    return { skipped: true };
  }
  if (
    typeof payload.elapsedMs === "number" &&
    payload.elapsedMs < MIN_ELAPSED_MS
  ) {
    return { ok: false, status: 400, error: "too_fast" };
  }
  const token = payload.turnstileToken;
  if (!token) {
    return { ok: false, status: 400, error: "missing_turnstile" };
  }
  const verify = await verifyTurnstile(token, getRemoteIp(req));
  if (!verify.ok) {
    return {
      ok: false,
      status: 403,
      error: "turnstile_failed",
      reason: verify.reason,
    };
  }
  return { ok: true };
}