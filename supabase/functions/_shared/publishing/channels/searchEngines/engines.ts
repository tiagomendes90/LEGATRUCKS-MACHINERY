// Sub-engine registry for the "search-engines" channel.
// Adding a new engine (Google Indexing API, Yandex, …) means creating
// one file exporting a SearchEngine and appending it to `engines`.
import type { PublishingContext } from "../../types.ts";
import { indexNowEngine } from "./indexnow.ts";

export interface SearchEngineResult {
  engine: string;
  status: "success" | "failed" | "skipped";
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  error?: string;
}

export interface SearchEngine {
  key: string;
  label: string;
  submit: (
    urls: string[],
    ctx: PublishingContext,
  ) => Promise<SearchEngineResult>;
}

export const engines: SearchEngine[] = [indexNowEngine];

export const enginesByKey: Record<string, SearchEngine> = Object.fromEntries(
  engines.map((e) => [e.key, e]),
);