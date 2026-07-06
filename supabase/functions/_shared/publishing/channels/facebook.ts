import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";
import { buildProductCaption, getPrimaryImageUrl, getProductUrl } from "../productFormatting.ts";

const GRAPH = "https://graph.facebook.com/v19.0";

export const facebookChannel: ChannelAdapter = {
  key: "facebook",
  label: "Facebook",
  supports: (e) => e.event_type === "product.published",
  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    const token = Deno.env.get("META_PAGE_ACCESS_TOKEN");
    const pageId =
      (ctx.channelConfig?.page_id as string | undefined) ?? Deno.env.get("META_PAGE_ID");
    if (!token || !pageId) {
      return {
        status: "skipped",
        response: { reason: "missing META_PAGE_ACCESS_TOKEN or META_PAGE_ID" },
      };
    }
    if (!ctx.product) {
      return { status: "skipped", response: { reason: "no product data" } };
    }

    const imageUrl = getPrimaryImageUrl(ctx.product);
    const link = getProductUrl(ctx.product);
    const caption = buildProductCaption(ctx.product, link);

    try {
      let endpoint: string;
      let body: Record<string, string>;
      if (imageUrl) {
        // Photo post — richer engagement, includes link in caption.
        endpoint = `${GRAPH}/${pageId}/photos`;
        body = { url: imageUrl, caption, access_token: token };
      } else {
        endpoint = `${GRAPH}/${pageId}/feed`;
        body = { message: caption, link, access_token: token };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(body).toString(),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: "failed",
          request: { endpoint, hasImage: !!imageUrl },
          response: json,
          error: json?.error?.message ?? `HTTP ${res.status}`,
        };
      }
      return {
        status: "success",
        request: { endpoint, hasImage: !!imageUrl, link },
        response: json,
      };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  },
};