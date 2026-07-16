// IndexNow engine — submits URLs to Bing/IndexNow.
// https://www.indexnow.org/documentation
import type { SearchEngine, SearchEngineResult } from "./engines.ts";

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://lega.pt";
const ENDPOINT = "https://api.indexnow.org/IndexNow";

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return SITE_URL.replace(/^https?:\/\//, "");
  }
}

export const indexNowEngine: SearchEngine = {
  key: "indexnow",
  label: "IndexNow (Bing)",
  async submit(urls, ctx): Promise<SearchEngineResult> {
    const key =
      (ctx.channelConfig?.indexnow_key as string | undefined) ??
      Deno.env.get("INDEXNOW_KEY");
    if (!key) {
      return {
        engine: "indexnow",
        status: "skipped",
        response: { reason: "missing INDEXNOW_KEY" },
      };
    }
    if (urls.length === 0) {
      return {
        engine: "indexnow",
        status: "skipped",
        response: { reason: "no urls" },
      };
    }
    const body = {
      host: host(urls[0]),
      key,
      keyLocation:
        (ctx.channelConfig?.indexnow_key_location as string | undefined) ??
        `${SITE_URL}/${key}.txt`,
      urlList: urls,
    };
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });
      const text = await res.text().catch(() => "");
      if (!res.ok && res.status !== 202 && res.status !== 200) {
        return {
          engine: "indexnow",
          status: "failed",
          request: { endpoint: ENDPOINT, urls: urls.length },
          response: { status: res.status, body: text.slice(0, 500) },
          error: `HTTP ${res.status}`,
        };
      }
      return {
        engine: "indexnow",
        status: "success",
        request: { endpoint: ENDPOINT, urls: urls.length },
        response: { status: res.status, body: text.slice(0, 500) },
      };
    } catch (err) {
      return {
        engine: "indexnow",
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};