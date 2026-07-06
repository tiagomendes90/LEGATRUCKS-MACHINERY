import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";
import {
  buildProductEmailHtml,
  buildProductEmailSubject,
  getProductUrl,
} from "../productFormatting.ts";

const RESEND = "https://api.resend.com";

export const newsletterChannel: ChannelAdapter = {
  key: "newsletter",
  label: "Newsletter",
  supports: (e) => e.event_type === "product.published",
  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const audienceId =
      (ctx.channelConfig?.audience_id as string | undefined) ??
      Deno.env.get("RESEND_AUDIENCE_ID");
    const from =
      (ctx.channelConfig?.from as string | undefined) ??
      Deno.env.get("RESEND_FROM_EMAIL");
    if (!apiKey || !audienceId || !from) {
      return {
        status: "skipped",
        response: {
          reason: "missing RESEND_API_KEY, RESEND_AUDIENCE_ID or RESEND_FROM_EMAIL",
        },
      };
    }
    if (!ctx.product) {
      return { status: "skipped", response: { reason: "no product data" } };
    }

    const link = getProductUrl(ctx.product);
    const subject = buildProductEmailSubject(ctx.product);
    const html = buildProductEmailHtml(ctx.product, link);

    try {
      // 1. Create broadcast targeting the audience.
      const createRes = await fetch(`${RESEND}/broadcasts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          audience_id: audienceId,
          from,
          subject,
          html,
        }),
      });
      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok || !createJson?.id) {
        return {
          status: "failed",
          request: { step: "create_broadcast", audienceId, from },
          response: createJson,
          error: createJson?.message ?? `HTTP ${createRes.status}`,
        };
      }

      // 2. Send it immediately.
      const sendRes = await fetch(`${RESEND}/broadcasts/${createJson.id}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({}),
      });
      const sendJson = await sendRes.json().catch(() => ({}));
      if (!sendRes.ok) {
        return {
          status: "failed",
          request: { step: "send_broadcast", broadcast_id: createJson.id },
          response: sendJson,
          error: sendJson?.message ?? `HTTP ${sendRes.status}`,
        };
      }
      return {
        status: "success",
        request: { audienceId, subject, from },
        response: { broadcast: createJson, send: sendJson },
      };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  },
};