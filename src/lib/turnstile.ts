// Cloudflare Turnstile — public Site Key (safe to ship in frontend).
// Secret Key is stored as a Supabase Edge Function secret (TURNSTILE_SECRET_KEY).
export const TURNSTILE_SITE_KEY = "0x4AAAAAADq36sSy962nnmD4";

export const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Minimum time (ms) between form render and submission. Submissions faster
 * than this are almost certainly bots and are rejected by the edge function.
 */
export const ANTI_SPAM_MIN_ELAPSED_MS = 1500;

/** Honeypot field name. Must remain empty on legitimate submissions. */
export const HONEYPOT_FIELD = "company_website";