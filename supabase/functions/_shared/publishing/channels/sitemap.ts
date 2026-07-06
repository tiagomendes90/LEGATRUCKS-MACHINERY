import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";

export const sitemapChannel: ChannelAdapter = {
  key: "sitemap",
  label: "Sitemap",
  supports: (e) =>
    e.event_type === "product.published" ||
    e.event_type === "product.updated" ||
    e.event_type === "product.unpublished",
  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    const webhook =
      (ctx.channelConfig?.webhook_url as string | undefined) ??
      Deno.env.get("SITEMAP_REBUILD_WEBHOOK_URL") ??
      Deno.env.get("LOVABLE_REBUILD_WEBHOOK_URL");
    if (!webhook) {
      return {
        status: "skipped",
        response: {
          reason:
            "missing SITEMAP_REBUILD_WEBHOOK_URL — sitemap regenerates on the next build",
        },
      };
    }
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: "publishing-service",
          event: ctx.event.event_type,
          product_id: ctx.event.product_id,
          at: new Date().toISOString(),
        }),
      });
      const text = await res.text().catch(() => "");
      if (!res.ok) {
        return {
          status: "failed",
          request: { webhook },
          response: { body: text.slice(0, 500) },
          error: `HTTP ${res.status}`,
        };
      }
      return {
        status: "success",
        request: { webhook },
        response: { body: text.slice(0, 500) },
      };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  },
};