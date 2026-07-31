// Admin-only preview renderer. Returns the exact HTML that would be sent
// for a given campaign (either persisted by id, or a draft in the body).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderNewsletterHtml } from "../_shared/publishing/newsletterTemplate.ts";
import { resolveRecipients } from "../_shared/publishing/channels/newsletter.ts";

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
    const testEmail = body?.test_email as string | undefined;
    const draft = body?.draft as
      | {
          title?: string;
          subject?: string;
          preheader?: string | null;
          product_ids?: string[];
          content_json?: Record<string, unknown> | null;
          template_id?: string | null;
          audience_mode?: string;
          list_ids?: string[];
          tags?: string[];
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
        template_id: draft.template_id ?? null,
        audience_mode: draft.audience_mode ?? "all",
        list_ids: draft.list_ids ?? [],
        tags: draft.tags ?? [],
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

    // Template reutilizável (cabeçalho / rodapé / intro / fecho)
    let templateBlocks: Record<string, string> | null = null;
    if (campaign.template_id) {
      const { data: t } = await admin
        .from("newsletter_templates")
        .select("content_json")
        .eq("id", campaign.template_id)
        .maybeSingle();
      templateBlocks = (t?.content_json ?? null) as any;
    }

    const html = renderNewsletterHtml({
      campaign: {
        title: campaign.title,
        subject: campaign.subject,
        preheader: campaign.preheader,
        content_json: campaign.content_json,
      },
      template: templateBlocks,
      products,
      unsubscribeUrl: testEmail ? "#preview-unsubscribe" : undefined,
    });

    // Estimativa de audiência (mesma resolução usada no envio real).
    let recipientCount = 0;
    try {
      recipientCount = (await resolveRecipients(admin, campaign)).length;
    } catch (_) {
      recipientCount = 0;
    }

    // ---- Envio de teste -------------------------------------------------
    if (testEmail) {
      const apiKey = Deno.env.get("RESEND_API_KEY");
      const from = Deno.env.get("RESEND_FROM_EMAIL");
      if (!apiKey || !from) return json(400, { error: "missing_resend_config" });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(testEmail)) {
        return json(400, { error: "invalid_email" });
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          from,
          to: [testEmail],
          subject: `[TESTE] ${campaign.subject}`,
          html: html.replaceAll("{{{RESEND_UNSUBSCRIBE_URL}}}", "#teste").replaceAll("{{RESEND_UNSUBSCRIBE_URL}}", "#teste"),
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error(`[newsletter-preview] test send failed [${res.status}]`, JSON.stringify(out));
        return json(res.status, { error: "test_send_failed", details: out });
      }
      await admin.from("newsletter_audit_log").insert({
        entity_type: "campaign",
        entity_id: campaignId ?? null,
        action: "campaign.test_sent",
        actor_id: uid,
        details: { to: testEmail, subject: campaign.subject },
      });
      return json(200, { ok: true, test_sent: true, to: testEmail, id: out?.id ?? null });
    }

    return json(200, {
      ok: true,
      html,
      subject: campaign.subject,
      product_count: products.length,
      recipient_count: recipientCount,
    });
  } catch (err) {
    return json(500, { error: "unexpected", detail: err instanceof Error ? err.message : String(err) });
  }
});