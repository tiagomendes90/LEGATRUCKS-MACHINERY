import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";
import { buildProductCaption, getPrimaryImageUrl, getProductUrl } from "../productFormatting.ts";

const GRAPH = "https://graph.facebook.com/v19.0";

export const instagramChannel: ChannelAdapter = {
  key: "instagram",
  label: "Instagram",
  supports: (e) => e.event_type === "product.published",
  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    // Instagram Business publishing uses the same Meta Page token.
    const token =
      Deno.env.get("META_PAGE_ACCESS_TOKEN") ?? Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
    const igUserId =
      (ctx.channelConfig?.ig_user_id as string | undefined) ??
      Deno.env.get("META_IG_USER_ID") ??
      Deno.env.get("INSTAGRAM_USER_ID");
    if (!token || !igUserId) {
      return {
        status: "skipped",
        response: { reason: "missing META_PAGE_ACCESS_TOKEN or META_IG_USER_ID" },
      };
    }
    if (!ctx.product) {
      return { status: "skipped", response: { reason: "no product data" } };
    }
    const imageUrl = getPrimaryImageUrl(ctx.product);
    if (!imageUrl) {
      return {
        status: "skipped",
        response: { reason: "instagram requires at least one public image" },
      };
    }
    const link = getProductUrl(ctx.product);
    const caption = buildProductCaption(ctx.product, link, { includeLinkInCaption: true });

    try {
      // 1. Create a media container.
      const createRes = await fetch(`${GRAPH}/${igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          image_url: imageUrl,
          caption,
          access_token: token,
        }).toString(),
      });
      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok || !createJson?.id) {
        return {
          status: "failed",
          request: { step: "create_container", imageUrl },
          response: createJson,
          error: createJson?.error?.message ?? `HTTP ${createRes.status}`,
        };
      }

      // 2. Publish the container.
      const publishRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          creation_id: createJson.id,
          access_token: token,
        }).toString(),
      });
      const publishJson = await publishRes.json().catch(() => ({}));
      if (!publishRes.ok) {
        return {
          status: "failed",
          request: { step: "media_publish", creation_id: createJson.id },
          response: publishJson,
          error: publishJson?.error?.message ?? `HTTP ${publishRes.status}`,
        };
      }
      return {
        status: "success",
        request: { imageUrl, link },
        response: { container: createJson, publish: publishJson },
      };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  },
};