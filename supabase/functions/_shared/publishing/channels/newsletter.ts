import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";

export const newsletterChannel: ChannelAdapter = {
  key: "newsletter",
  label: "Newsletter",
  supports: (e) => e.event_type === "product.published",
  async publish(_ctx: PublishingContext): Promise<ChannelResult> {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return { status: "skipped", response: { reason: "missing RESEND_API_KEY" } };
    }
    // TODO Phase 2: queue newsletter batch (Resend audience/broadcast).
    return { status: "skipped", response: { reason: "newsletter adapter stub — implement in phase 2" } };
  },
};