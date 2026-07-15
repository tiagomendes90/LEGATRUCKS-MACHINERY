// Shared PublishingService types (used by edge functions).
export type PublishingEventType =
  | "product.published"
  | "product.updated"
  | "product.unpublished"
  | "social.publish.confirmed"
  | "social.republish"
  | "social.delete"
  | "newsletter.instant"
  | "digest.weekly";

export interface PublishingEvent {
  id: string;
  event_type: PublishingEventType | string;
  product_id: string | null;
  payload: Record<string, unknown>;
  attempts?: number;
  retry_cycle?: number;
  scheduled_for?: string | null;
  dedupe_key?: string | null;
}

export type ChannelResultStatus = "success" | "failed" | "skipped";

export interface ChannelResult {
  status: ChannelResultStatus;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  error?: string;
}

export interface PublishingContext {
  event: PublishingEvent;
  product: Record<string, unknown> | null;
  channelConfig: Record<string, unknown>;
  supabaseUrl: string;
  serviceRoleKey: string;
}

export interface ChannelAdapter {
  key: string;
  label: string;
  supports: (event: PublishingEvent) => boolean;
  publish: (ctx: PublishingContext) => Promise<ChannelResult>;
}