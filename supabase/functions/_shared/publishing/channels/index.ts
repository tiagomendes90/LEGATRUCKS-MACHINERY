import type { ChannelAdapter } from "../types.ts";
import { sitemapChannel } from "./sitemap.ts";
import { facebookChannel } from "./facebook.ts";
import { instagramChannel } from "./instagram.ts";
import { newsletterChannel } from "./newsletter.ts";
import { searchEnginesChannel } from "./searchEngines.ts";
import { facebookStoryChannel, instagramStoryChannel } from "./stories.ts";

// Register every adapter here. Adding a new channel (LinkedIn, WhatsApp, …)
// means creating a new file in ./channels/ and appending it below.
export const channels: ChannelAdapter[] = [
  sitemapChannel,
  searchEnginesChannel,
  facebookChannel,
  instagramChannel,
  facebookStoryChannel,
  instagramStoryChannel,
  newsletterChannel,
];

export const channelsByKey: Record<string, ChannelAdapter> = Object.fromEntries(
  channels.map((c) => [c.key, c]),
);