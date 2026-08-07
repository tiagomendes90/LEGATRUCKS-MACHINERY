// Versão web pública de uma campanha: /newsletter/{public_number}?lang=xx
// Devolve o HTML exato do email nesse idioma. Se vier `t` (token do
// subscritor), guarda a preferência de idioma escolhida.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderNewsletterHtml } from "../_shared/publishing/newsletterTemplate.ts";
import { loadProductsByIds } from "../_shared/publishing/productQuery.ts";
import { loadNewsletterI18n } from "../_shared/publishing/i18n/index.ts";
import { resolveCampaignContent } from "../_shared/publishing/i18n/campaignContent.ts";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let number = url.searchParams.get("n");
    const langParam = url.searchParams.get("lang");
    const token = url.searchParams.get("t");
    if (!number) {
      const seg = url.pathname.split("/").filter(Boolean).pop();
      if (seg && /^\d+$/.test(seg)) number = seg;
    }
    if (!number || !/^\d+$/.test(number)) return json(400, { error: "invalid_number" });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: campaign } = await admin
      .from("newsletter_campaigns")
      .select("*")
      .eq("public_number", Number(number))
      .maybeSingle();
    if (!campaign) return json(404, { error: "not_found" });
    if (!["sent", "sending", "scheduled"].includes(campaign.status)) {
      return json(404, { error: "not_published" });
    }

    const i18n = await loadNewsletterI18n(admin);
    const lang = i18n.resolve(langParam ?? campaign.default_language);

    // Guardar preferência de idioma do subscritor, se identificado.
    if (token && langParam) {
      await admin
        .from("newsletter_subscribers")
        .update({ preferred_language: lang })
        .eq("unsubscribe_token", token);
    }

    const [{ data: translations }, products] = await Promise.all([
      admin.from("newsletter_campaign_translations").select("*").eq("campaign_id", campaign.id),
      loadProductsByIds(admin, campaign.product_ids ?? []),
    ]);

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
      template: templateBlocks as any,
      products,
      i18n,
      lang,
      translations: (translations ?? []) as any,
      publicNumber: campaign.public_number,
      subscriberToken: token,
      unsubscribeUrl: token
        ? `${Deno.env.get("SUPABASE_URL")}/functions/v1/newsletter-unsubscribe?token=${encodeURIComponent(token)}`
        : `${Deno.env.get("PUBLIC_SITE_URL") ?? "https://www.lega.pt"}/contactos`,
    });

    const resolved = resolveCampaignContent(campaign, lang, i18n, (translations ?? []) as any, templateBlocks as any);

    if (url.searchParams.get("format") === "json") {
      return json(200, {
        ok: true,
        html,
        language: lang,
        subject: resolved.subject,
        languages: i18n.languages.map((l) => ({
          code: l.code,
          native_label: l.native_label,
          flag_emoji: l.flag_emoji,
        })),
      });
    }

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    return json(500, { error: "unexpected", detail: err instanceof Error ? err.message : String(err) });
  }
});
