// "search-engines" channel — independent from the social channels.
// Delegates to a registry of sub-engines (IndexNow today, Google/Yandex
// tomorrow). Also pings the dynamic sitemap so caches refresh.
// Adding a new search engine requires only adding a file under
// ./searchEngines/ — no changes to the dispatcher or other channels.
import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";
import { engines, enginesByKey } from "./searchEngines/engines.ts";
import { getProductUrl } from "../productFormatting.ts";

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://lega.pt";

function selectEngines(ctx: PublishingContext) {
  const configured = Array.isArray(ctx.channelConfig?.engines)
    ? (ctx.channelConfig!.engines as string[])
    : engines.map((e) => e.key);
  return configured
    .map((k) => enginesByKey[k])
    .filter((e): e is NonNullable<typeof e> => !!e);
}

export const searchEnginesChannel: ChannelAdapter = {
  key: "search-engines",
  label: "Motores de Pesquisa",
  supports: (e) =>
    e.event_type === "product.published" ||
    e.event_type === "product.updated" ||
    e.event_type === "product.unpublished",
  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    const active = selectEngines(ctx);
    if (active.length === 0) {
      return { status: "skipped", response: { reason: "no engines configured" } };
    }

    // URLs to submit: the product page and the sitemap itself so
    // crawlers pick up the removal/update on the listing pages too.
    const urls: string[] = [];
    if (ctx.product) urls.push(getProductUrl(ctx.product));
    urls.push(`${SITE_URL}/sitemap.xml`);

    const results = await Promise.all(active.map((e) => e.submit(urls, ctx)));

    const anyFailed = results.some((r) => r.status === "failed");
    const allSkipped = results.every((r) => r.status === "skipped");
    return {
      status: allSkipped ? "skipped" : anyFailed ? "failed" : "success",
      request: { urls, engines: active.map((e) => e.key) },
      response: { engines: results },
      error: anyFailed
        ? results.filter((r) => r.status === "failed").map((r) => `${r.engine}: ${r.error}`).join("; ")
        : undefined,
    };
  },
};