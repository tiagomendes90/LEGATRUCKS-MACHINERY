import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MIN_ELAPSED_MS = 1500;

interface Body {
  name?: string;
  email?: string;
  phone?: string | null;
  message?: string;
  source?: "general" | "vehicle";
  vehicle_id?: string | null;
  vehicle_title?: string | null;
  vehicle_url?: string | null;
  interest?: string | null;
  company?: string | null;
  // anti-spam
  turnstileToken?: string;
  honeypot?: string;
  elapsedMs?: number;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function bad(reason: string) {
  return json({ error: reason }, 400);
}

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
      reason: data.success ? "ok" : (data["error-codes"] || []).join(",") || "invalid",
    };
  } catch (_e) {
    return { ok: false, reason: "network" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad("method_not_allowed");

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return bad("invalid_json");
  }

  // Honeypot
  if (body.honeypot && body.honeypot.trim().length > 0) {
    return json({ ok: true, skipped: true }, 200); // pretend success
  }

  // Min elapsed time
  if (typeof body.elapsedMs === "number" && body.elapsedMs < MIN_ELAPSED_MS) {
    return bad("too_fast");
  }

  // Basic validation
  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const message = (body.message || "").trim();
  const source: "general" | "vehicle" = body.source === "vehicle" ? "vehicle" : "general";

  if (!name || name.length > 120) return bad("invalid_name");
  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("invalid_email");
  if (!message || message.length > 4000) return bad("invalid_message");

  // Turnstile
  const token = body.turnstileToken;
  if (!token) return bad("missing_turnstile");
  const remoteip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;
  const verify = await verifyTurnstile(token, remoteip);
  if (!verify.ok) return json({ error: "turnstile_failed", reason: verify.reason }, 403);

  // Insert via service role
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("contact_messages")
    .insert([
      {
        name,
        email,
        phone: body.phone?.toString().trim() || null,
        message,
        source,
        vehicle_id: body.vehicle_id || null,
        vehicle_title: body.vehicle_title || null,
        vehicle_url: body.vehicle_url || null,
        interest: body.interest || null,
        company: body.company || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("insert error", error);
    return json({ error: "db_error", details: error.message }, 500);
  }

  return json({ ok: true, id: data?.id });
});