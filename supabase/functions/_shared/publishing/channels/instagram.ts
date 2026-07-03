import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";

export const instagramChannel: ChannelAdapter = {
  key: "instagram",
  label: "Instagram",
  supports: (e) => e.event_type === "product.published",
  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    const token = Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
    const igUserId = (ctx.channelConfig?.ig_user_id as string | undefined) ?? Deno.env.get("INSTAGRAM_USER_ID");
    if (!token || !igUserId) {
      return { status: "skipped", response: { reason: "missing INSTAGRAM_ACCESS_TOKEN or ig_user_id" } };
    }
    // TODO Phase 2: create media container + publish via Graph API.
    return { status: "skipped", response: { reason: "instagram adapter stub — implement in phase 2" } };
  },
};