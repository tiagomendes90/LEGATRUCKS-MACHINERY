// Admin-only preview renderer. Returns the exact HTML that would be sent
// for a given campaign (either persisted by id, or a draft in the body).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderNewsletterHtml } from "../_shared/publishing/newsletterTemplate.ts";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json(401, { error: "unauthorized" });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: userRes } = await admin.auth.getUser(token);
    const uid = userRes?.user?.id;
    if (!uid) return json(401, { error: "unauthorized" });

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", uid)
      .maybeSingle();
    if (profile?.role !== "admin") return json(403, { error: "forbidden" });

    const body = await req.json().catch(() => ({}));
    const campaignId = body?.campaign_id as string | undefined;
    const draft = body?.draft as
      | {
          title?: string;
          subject?: string;
          preheader?: string | null;
          product_ids?: string[];
          content_json?: Record<string, unknown> | null;
        }
      | undefined;

    let campaign: any;
    let productIds: string[] = [];

    if (campaignId) {
      const { data: c, error } = await admin
        .from("newsletter_campaigns")
        .select("*")
        .eq("id", campaignId)
        .maybeSingle();
      if (error || !c) return json(404, { error: "campaign_not_found" });
      campaign = c;
      productIds = c.product_ids ?? [];
    } else if (draft) {
      campaign = {
        title: draft.title ?? "Preview",
        subject: draft.subject ?? "Preview LEGA",
        preheader: draft.preheader ?? null,
        content_json: draft.content_json ?? {},
      };
      productIds = draft.product_ids ?? [];
    } else {
      return json(400, { error: "campaign_id or draft required" });
    }

    let products: Record<string, unknown>[] = [];
    if (productIds.length > 0) {
      const { data: prods } = await admin
        .from("products")
        .select("id, title, description, price, currency, year, brand:brands(name, slug), images:product_images(image_url, is_primary, sort_order)")
        .in("id", productIds);
      const byId = new Map((prods ?? []).map((p: any) => [p.id, p]));
      products = productIds.map((id) => byId.get(id)).filter(Boolean) as any;
    }

    const html = renderNewsletterHtml({
      campaign: {
        title: campaign.title,
        subject: campaign.subject,
        preheader: campaign.preheader,
        content_json: campaign.content_json,
      },
      products,
      unsubscribeUrl: "#preview-unsubscribe",
    });

    return json(200, {
      ok: true,
      html,
      subject: campaign.subject,
      product_count: products.length,
    });
  } catch (err) {
    return json(500, { error: "unexpected", detail: err instanceof Error ? err.message : String(err) });
  }
});