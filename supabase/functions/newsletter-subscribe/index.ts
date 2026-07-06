// Adds a subscriber to the configured Resend Audience.
// Public endpoint invoked from the site footer form.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const RESEND = "https://api.resend.com";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 320;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" });

  try {
    const body = await req.json().catch(() => ({}));
    const email = (body?.email as string | undefined)?.trim().toLowerCase();
    const firstName = (body?.first_name as string | undefined)?.slice(0, 80);
    const lastName = (body?.last_name as string | undefined)?.slice(0, 80);
    const consent = body?.consent === true;

    if (!isValidEmail(email)) return jsonResponse(400, { error: "invalid_email" });
    if (!consent) return jsonResponse(400, { error: "consent_required" });

    const apiKey = Deno.env.get("RESEND_API_KEY");
    const audienceId = Deno.env.get("RESEND_AUDIENCE_ID");
    if (!apiKey || !audienceId) {
      return jsonResponse(503, {
        error: "newsletter_not_configured",
        detail: "missing RESEND_API_KEY or RESEND_AUDIENCE_ID",
      });
    }

    const res = await fetch(`${RESEND}/audiences/${audienceId}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        unsubscribed: false,
      }),
    });
    const json = await res.json().catch(() => ({}));

    // Resend returns 200/201 on success, 409-ish behavior when contact exists.
    if (!res.ok && res.status !== 409) {
      return jsonResponse(res.status, {
        error: "resend_error",
        detail: json?.message ?? `HTTP ${res.status}`,
      });
    }

    return jsonResponse(200, { ok: true, contact: json });
  } catch (err) {
    return jsonResponse(500, {
      error: "unexpected",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});