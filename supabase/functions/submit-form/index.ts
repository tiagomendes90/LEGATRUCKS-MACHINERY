// Unified form submission edge function.
// Every public form on the site (Contact, Vehicle contact, Quote request,
// Parts request, Sell-equipment, and any future form) routes through here.
// Distinction between forms is made only via the `source` field.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  sendAdminNotification,
  type NotificationKind,
} from "../_shared/sendAdminNotification.ts";
import { runAntiSpam } from "../_shared/antiSpam.ts";

type Source =
  | "general"
  | "vehicle"
  | "quote"
  | "parts"
  | "sell_equipment"
  | string; // forward-compatible: any future identifier is accepted

interface Body {
  source?: Source;
  name?: string;
  email?: string;
  phone?: string | null;
  message?: string | null;
  // Optional typed columns
  vehicle_id?: string | null;
  vehicle_title?: string | null;
  vehicle_url?: string | null;
  vehicle_price?: number | null;
  interest?: string | null;
  company?: string | null;
  // Free-form per-source extras
  metadata?: Record<string, unknown> | null;
  // Anti-spam
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
function bad(reason: string, status = 400) {
  return json({ error: reason }, status);
}

function mapKind(source: Source): NotificationKind {
  switch (source) {
    case "vehicle":
      return "contact_vehicle";
    case "quote":
      return "order_quote";
    case "parts":
      return "parts_request";
    case "sell_equipment":
      return "sell_equipment";
    case "general":
      return "contact_general";
    default:
      return "other";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad("method_not_allowed", 405);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return bad("invalid_json");
  }

  // ---- Anti-spam (honeypot / timing / Turnstile) ----
  const anti = await runAntiSpam(req, {
    turnstileToken: body.turnstileToken,
    honeypot: body.honeypot,
    elapsedMs: body.elapsedMs,
  });
  if ("skipped" in anti) return json({ ok: true, skipped: true });
  if (!anti.ok) return json({ error: anti.error, reason: anti.reason }, anti.status);

  // ---- Validation ----
  const source: Source = (body.source as Source) || "general";
  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const message = (body.message || "").toString().trim();

  if (!name || name.length > 120) return bad("invalid_name");
  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad("invalid_email");
  }
  if (message.length > 4000) return bad("invalid_message");

  // Source-specific requirements
  if (source === "vehicle" || source === "quote") {
    if (!body.vehicle_id || typeof body.vehicle_id !== "string") {
      return bad("invalid_vehicle_id");
    }
    if (!body.vehicle_title || body.vehicle_title.length > 255) {
      return bad("invalid_vehicle_title");
    }
  }
  // For everything except 'general' / 'vehicle' an empty message is allowed;
  // for 'general' message is required.
  if (source === "general" && !message) return bad("invalid_message");

  // ---- Persist to the unified table ----
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // The `source` column accepts free text; we normalize a couple of values
  // so admin UI keeps working with the historical 'general' / 'vehicle' set.
  const persistedSource =
    source === "quote"
      ? "vehicle" // quote requests are vehicle-bound
      : source;

  const metadata: Record<string, unknown> = {
    ...(body.metadata || {}),
    submission_kind: source, // preserve the true distinction
  };
  if (typeof body.vehicle_price === "number" && body.vehicle_price > 0) {
    metadata.vehicle_price = body.vehicle_price;
  }

  const { data, error } = await supabase
    .from("contact_messages")
    .insert([
      {
        name,
        email,
        phone: body.phone?.toString().trim() || null,
        message: message || `[${source}]`,
        source: persistedSource,
        vehicle_id: body.vehicle_id || null,
        vehicle_title: body.vehicle_title || null,
        vehicle_url: body.vehicle_url || null,
        interest: body.interest || null,
        company: body.company || null,
        metadata,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("[submit-form] insert error", error);
    return json({ error: "db_error", details: error.message }, 500);
  }

  // ---- Best-effort admin notification ----
  try {
    await sendAdminNotification({
      kind: mapKind(source),
      name,
      email,
      phone: body.phone?.toString().trim() || null,
      message: message || null,
      vehicleTitle: body.vehicle_title || null,
      vehicleUrl: body.vehicle_url || null,
      vehiclePrice:
        typeof body.vehicle_price === "number" ? body.vehicle_price : null,
      metadata: body.metadata || null,
    });
  } catch (e) {
    console.error("[submit-form] notification failed", e);
  }

  return json({ ok: true, id: data?.id });
});