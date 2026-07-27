import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";
import { renderNewsletterHtml } from "../newsletterTemplate.ts";

const RESEND = "https://api.resend.com";

// Adapter is fully decoupled from product events. It only reacts to
// explicit newsletter.* events emitted from the admin panel.
// Isolated from Facebook/Instagram/sitemap adapters.
export const newsletterChannel: ChannelAdapter = {
  key: "newsletter",
  label: "Newsletter",
  supports: (e) =>
    e.event_type === "newsletter.campaign.send" ||
    e.event_type === "newsletter.campaign.cancel",
  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const audienceId =
      (ctx.channelConfig?.audience_id as string | undefined) ??
      Deno.env.get("RESEND_AUDIENCE_ID");
    const from =
      (ctx.channelConfig?.from as string | undefined) ??
      Deno.env.get("RESEND_FROM_EMAIL");

    if (!apiKey) {
      return { status: "skipped", response: { reason: "missing RESEND_API_KEY" } };
    }

    const supabase = createClient(ctx.supabaseUrl, ctx.serviceRoleKey);
    const campaignId = ctx.event.payload?.campaign_id as string | undefined;
    if (!campaignId) {
      return { status: "failed", error: "campaign_id missing in payload" };
    }

    // ---- CANCEL --------------------------------------------------------
    if (ctx.event.event_type === "newsletter.campaign.cancel") {
      const { data: c } = await supabase
        .from("newsletter_campaigns")
        .select("id, broadcast_id, status")
        .eq("id", campaignId)
        .maybeSingle();
      if (!c) return { status: "failed", error: "campaign not found" };
      if (!c.broadcast_id) {
        await supabase
          .from("newsletter_campaigns")
          .update({ status: "canceled" })
          .eq("id", campaignId);
        return { status: "success", response: { canceled: true, remote: false } };
      }
      try {
        const res = await fetch(`${RESEND}/broadcasts/${c.broadcast_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const body = await res.json().catch(() => ({}));
        await supabase
          .from("newsletter_campaigns")
          .update({ status: "canceled" })
          .eq("id", campaignId);
        return { status: "success", response: { canceled: true, remote: body } };
      } catch (err) {
        return { status: "failed", error: err instanceof Error ? err.message : String(err) };
      }
    }

    // ---- SEND ----------------------------------------------------------
    if (!audienceId || !from) {
      return {
        status: "skipped",
        response: { reason: "missing RESEND_AUDIENCE_ID or RESEND_FROM_EMAIL" },
      };
    }

    // Load campaign + products
    const { data: campaign, error: campErr } = await supabase
      .from("newsletter_campaigns")
      .select("*")
      .eq("id", campaignId)
      .maybeSingle();
    if (campErr || !campaign) {
      return { status: "failed", error: campErr?.message ?? "campaign not found" };
    }
    if (campaign.status === "sent") {
      return { status: "skipped", response: { reason: "campaign already sent" } };
    }

    // Fetch products (preserve admin order)
    const productIds: string[] = campaign.product_ids ?? [];
    let products: Record<string, unknown>[] = [];
    if (productIds.length > 0) {
      const { data: prods } = await supabase
        .from("products")
        .select("id, title, description, price, currency, year, brand:brands(name, slug), images:product_images(image_url, is_primary, sort_order)")
        .in("id", productIds);
      const byId = new Map((prods ?? []).map((p: any) => [p.id, p]));
      products = productIds.map((id) => byId.get(id)).filter(Boolean) as any;
    }

    const html = campaign.content_html && campaign.content_html.length > 100
      ? campaign.content_html
      : renderNewsletterHtml({
          campaign: {
            title: campaign.title,
            subject: campaign.subject,
            preheader: campaign.preheader,
            content_json: campaign.content_json,
          },
          products,
        });

    // Mark as sending (best-effort)
    await supabase
      .from("newsletter_campaigns")
      .update({ status: "sending" })
      .eq("id", campaignId);

    try {
      const createRes = await fetch(`${RESEND}/broadcasts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          audience_id: audienceId,
          from,
          subject: campaign.subject,
          html,
        }),
      });
      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok || !createJson?.id) {
        await supabase
          .from("newsletter_campaigns")
          .update({ status: "failed", last_error: createJson?.message ?? `HTTP ${createRes.status}` })
          .eq("id", campaignId);
        await supabase.from("newsletter_sends").insert({
          campaign_id: campaignId,
          status: "failed",
          error: createJson?.message ?? `HTTP ${createRes.status}`,
          raw_response: createJson,
        });
        return {
          status: "failed",
          request: { step: "create_broadcast", audienceId, from },
          response: createJson,
          error: createJson?.message ?? `HTTP ${createRes.status}`,
        };
      }

      const broadcastId = createJson.id as string;

      const sendRes = await fetch(`${RESEND}/broadcasts/${broadcastId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({}),
      });
      const sendJson = await sendRes.json().catch(() => ({}));
      if (!sendRes.ok) {
        await supabase
          .from("newsletter_campaigns")
          .update({
            status: "failed",
            broadcast_id: broadcastId,
            last_error: sendJson?.message ?? `HTTP ${sendRes.status}`,
          })
          .eq("id", campaignId);
        await supabase.from("newsletter_sends").insert({
          campaign_id: campaignId,
          status: "failed",
          broadcast_id: broadcastId,
          error: sendJson?.message ?? `HTTP ${sendRes.status}`,
          raw_response: sendJson,
        });
        return {
          status: "failed",
          request: { step: "send_broadcast", broadcast_id: broadcastId },
          response: sendJson,
          error: sendJson?.message ?? `HTTP ${sendRes.status}`,
        };
      }

      // Recipient count (best-effort — audience size not returned by Resend send call).
      const { count: activeCount } = await supabase
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

      await supabase
        .from("newsletter_campaigns")
        .update({
          status: "sent",
          broadcast_id: broadcastId,
          sent_at: new Date().toISOString(),
          content_html: html,
          last_error: null,
          stats: { audience_size_at_send: activeCount ?? null },
        })
        .eq("id", campaignId);

      await supabase.from("newsletter_sends").insert({
        campaign_id: campaignId,
        status: "sent",
        broadcast_id: broadcastId,
        recipients_count: activeCount ?? null,
        sent_at: new Date().toISOString(),
        raw_response: { create: createJson, send: sendJson },
      });

      return {
        status: "success",
        request: { audienceId, from, subject: campaign.subject, broadcast_id: broadcastId },
        response: { broadcast: createJson, send: sendJson, recipients: activeCount ?? null },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabase
        .from("newsletter_campaigns")
        .update({ status: "failed", last_error: msg })
        .eq("id", campaignId);
      return { status: "failed", error: msg };
    }
  },
};