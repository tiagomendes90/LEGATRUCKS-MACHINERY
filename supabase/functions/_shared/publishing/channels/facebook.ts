import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";

export const facebookChannel: ChannelAdapter = {
  key: "facebook",
  label: "Facebook",
  supports: (e) => e.event_type === "product.published",
  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    const token = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN");
    const pageId = (ctx.channelConfig?.page_id as string | undefined) ?? Deno.env.get("FACEBOOK_PAGE_ID");
    if (!token || !pageId) {
      return { status: "skipped", response: { reason: "missing FACEBOOK_PAGE_ACCESS_TOKEN or page_id" } };
    }
    // TODO Phase 2: call https://graph.facebook.com/v19.0/{pageId}/feed with message + link.
    return { status: "skipped", response: { reason: "facebook adapter stub — implement in phase 2" } };
  },
};