import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendAdminNotification } from "../_shared/sendAdminNotification.ts";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MIN_ELAPSED_MS = 1500;

interface Body {
  name?: string;
  customer_email?: string;
  vehicle_id?: string;
  vehicle_title?: string;
  vehicle_price?: number;
  phone?: string | null;
  message?: string | null;
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

  if (body.honeypot && body.honeypot.trim().length > 0) {
    return json({ ok: true, skipped: true }, 200);
  }
  if (typeof body.elapsedMs === "number" && body.elapsedMs < MIN_ELAPSED_MS) {
    return bad("too_fast");
  }

  const name = (body.name || "").trim();
  const email = (body.customer_email || "").trim();
  const truckModel = (body.vehicle_title || "").trim();
  const amount = typeof body.vehicle_price === "number" ? body.vehicle_price : 0;

  if (!name || name.length > 120) return bad("invalid_name");
  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("invalid_email");
  if (!truckModel || truckModel.length > 255) return bad("invalid_vehicle_title");
  if (!body.vehicle_id || typeof body.vehicle_id !== "string") return bad("invalid_vehicle_id");
  if (amount < 0 || amount > 100_000_000) return bad("invalid_amount");

  const token = body.turnstileToken;
  if (!token) return bad("missing_turnstile");
  const remoteip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;
  const verify = await verifyTurnstile(token, remoteip);
  if (!verify.ok) return json({ error: "turnstile_failed", reason: verify.reason }, 403);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("orders")
    .insert([
      {
        name,
        customer_email: email,
        vehicle_id: body.vehicle_id,
        truck_model: truckModel,
        amount,
        status: "pending",
        payment_status: "pending",
        phone: body.phone?.toString().trim() || null,
        message: body.message?.toString().trim() || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("insert error", error);
    return json({ error: "db_error", details: error.message }, 500);
  }

  // Best-effort admin notification — failure must not impact the user.
  try {
    await sendAdminNotification({
      kind: "order_quote",
      name,
      email,
      phone: body.phone?.toString().trim() || null,
      message: body.message?.toString().trim() || null,
      vehicleTitle: truckModel,
      vehicleUrl: body.vehicle_id ? `https://lega.pt/veiculo/${body.vehicle_id}` : null,
      vehiclePrice: amount,
    });
  } catch (e) {
    console.error("notification failed", e);
  }

  return json({ ok: true, id: data?.id });
});