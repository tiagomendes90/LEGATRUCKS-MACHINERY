// Adds a subscriber to the configured Resend Audience.
// Public endpoint invoked from the site footer form.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // 1. Persist in newsletter_subscribers first (source of truth).
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, status, unsubscribe_token")
      .eq("email", email!)
      .maybeSingle();

    let subscriberRow = existing;
    if (!existing) {
      const { data: inserted, error: insErr } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email,
          first_name: firstName ?? null,
          last_name: lastName ?? null,
          consent: true,
          status: "active",
          source: "footer_form",
        })
        .select("id, status, unsubscribe_token")
        .maybeSingle();
      if (insErr) {
        console.warn("[newsletter-subscribe] insert failed", insErr);
      }
      subscriberRow = inserted ?? null;
    } else if (existing.status === "unsubscribed") {
      await supabase
        .from("newsletter_subscribers")
        .update({ status: "active", unsubscribed_at: null, consent: true })
        .eq("id", existing.id);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    const audienceId = Deno.env.get("RESEND_AUDIENCE_ID");
    if (!apiKey || !audienceId) {
      // Subscriber saved locally; Resend sync pending — still a success from
      // the user's perspective as long as we captured the address.
      return jsonResponse(200, {
        ok: true,
        contact: null,
        warning: "resend_not_configured",
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

    if (subscriberRow && (json as any)?.id) {
      await supabase
        .from("newsletter_subscribers")
        .update({ resend_contact_id: (json as any).id })
        .eq("id", subscriberRow.id);
    }

    return jsonResponse(200, { ok: true, contact: json });
  } catch (err) {
    return jsonResponse(500, {
      error: "unexpected",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});