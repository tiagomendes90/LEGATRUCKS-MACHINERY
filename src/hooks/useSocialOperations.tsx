import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/admin/supabaseClient";

export type SocialChannelKey = "facebook" | "instagram";
export const SOCIAL_CHANNELS: SocialChannelKey[] = ["facebook", "instagram"];

export interface SocialChannelMetrics {
  channel: SocialChannelKey;
  published: number;
  live_posts: number;
  failed_events_24h: number;
  retries_24h: number;
  last_event_at: string | null;
  last_event_status: string | null;
}

export interface SocialOverviewMetrics {
  ready_for_social: number;
  outdated: number;
  published: number;
  not_ready: number;
  total_active: number;
  events_pending: number;
  events_processing: number;
  events_failed: number;
  channels: SocialChannelMetrics[];
}

export interface SocialTimelineEntry {
  id: string;
  event_id: string;
  event_type: string;
  product_id: string | null;
  product_title: string | null;
  channel: string | null;
  from_status: string | null;
  to_status: string;
  attempts: number | null;
  retry_cycle: number | null;
  reason: string | null;
  worker: string | null;
  created_at: string;
}

const SOCIAL_EVENT_TYPES = [
  "social.publish.confirmed",
  "social.republish",
  "social.delete",
];

function pickChannel(payload: any): string | null {
  if (!payload || typeof payload !== "object") return null;
  return (payload.channel as string) ?? null;
}

export function useSocialMetrics() {
  return useQuery({
    queryKey: ["social_metrics"],
    refetchInterval: 30000,
    queryFn: async (): Promise<SocialOverviewMetrics> => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [
        productsRes,
        postsRes,
        eventsRes,
        recentEventsRes,
      ] = await Promise.all([
        supabase
          .from("products")
          .select("id, social_status, is_active")
          .eq("is_active", true),
        (supabase as any)
          .from("product_social_posts")
          .select("id, channel_key, status, published_at")
          .eq("status", "published"),
        supabase
          .from("publishing_events")
          .select("id, status, event_type, payload")
          .in("event_type", SOCIAL_EVENT_TYPES),
        supabase
          .from("publishing_events")
          .select("id, status, event_type, payload, attempts, created_at, processed_at")
          .in("event_type", SOCIAL_EVENT_TYPES)
          .gte("created_at", since),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (postsRes.error) throw postsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (recentEventsRes.error) throw recentEventsRes.error;

      const products = productsRes.data ?? [];
      const posts = (postsRes.data ?? []) as Array<{
        channel_key: string;
        status: string;
        published_at: string;
      }>;
      const events = (eventsRes.data ?? []) as Array<{
        status: string;
        event_type: string;
        payload: any;
      }>;
      const recent = (recentEventsRes.data ?? []) as Array<{
        status: string;
        event_type: string;
        payload: any;
        attempts: number | null;
        created_at: string;
      }>;

      const statusCount: Record<string, number> = {};
      for (const p of products) {
        statusCount[p.social_status] = (statusCount[p.social_status] ?? 0) + 1;
      }

      const eventsPending = events.filter((e) =>
        ["pending", "scheduled"].includes(e.status),
      ).length;
      const eventsProcessing = events.filter((e) => e.status === "processing").length;
      const eventsFailed = events.filter((e) => e.status === "failed").length;

      const channels: SocialChannelMetrics[] = SOCIAL_CHANNELS.map((ch) => {
        const live = posts.filter((p) => p.channel_key === ch);
        const chanRecent = recent.filter((e) => pickChannel(e.payload) === ch);
        const failed24h = chanRecent.filter((e) => e.status === "failed").length;
        const retries24h = chanRecent.reduce(
          (acc, e) => acc + Math.max(0, (e.attempts ?? 1) - 1),
          0,
        );
        const last = [...live].sort((a, b) =>
          b.published_at.localeCompare(a.published_at),
        )[0];
        return {
          channel: ch,
          published: live.length,
          live_posts: live.length,
          failed_events_24h: failed24h,
          retries_24h: retries24h,
          last_event_at: last?.published_at ?? null,
          last_event_status: last ? "published" : null,
        };
      });

      return {
        ready_for_social: statusCount["ready_for_social"] ?? 0,
        outdated: statusCount["outdated"] ?? 0,
        published: statusCount["published"] ?? 0,
        not_ready: statusCount["not_ready"] ?? 0,
        total_active: products.length,
        events_pending: eventsPending,
        events_processing: eventsProcessing,
        events_failed: eventsFailed,
        channels,
      };
    },
  });
}

export function useSocialTimeline(limit = 40) {
  return useQuery({
    queryKey: ["social_timeline", limit],
    refetchInterval: 20000,
    queryFn: async (): Promise<SocialTimelineEntry[]> => {
      // 1) Recent social events
      const { data: events, error: eErr } = await supabase
        .from("publishing_events")
        .select("id, event_type, product_id, payload, created_at")
        .in("event_type", SOCIAL_EVENT_TYPES)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (eErr) throw eErr;
      const eventList = events ?? [];
      if (!eventList.length) return [];

      const eventIds = eventList.map((e: any) => e.id);
      const productIds = Array.from(
        new Set(eventList.map((e: any) => e.product_id).filter(Boolean)),
      );

      // 2) Transitions for those events (chronological history)
      const { data: transitions, error: tErr } = await (supabase as any)
        .from("publishing_event_transitions")
        .select("*")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false });
      if (tErr) throw tErr;

      // 3) Product titles for readability
      const { data: products, error: pErr } = productIds.length
        ? await supabase.from("products").select("id, title").in("id", productIds as string[])
        : { data: [], error: null } as any;
      if (pErr) throw pErr;

      const eventMap = new Map<string, any>(eventList.map((e: any) => [e.id, e]));
      const productMap = new Map<string, string>(
        (products ?? []).map((p: any) => [p.id, p.title]),
      );

      const rows: SocialTimelineEntry[] = (transitions ?? []).map((t: any) => {
        const ev = eventMap.get(t.event_id);
        return {
          id: t.id,
          event_id: t.event_id,
          event_type: ev?.event_type ?? "",
          product_id: ev?.product_id ?? null,
          product_title: ev?.product_id ? productMap.get(ev.product_id) ?? null : null,
          channel: pickChannel(ev?.payload),
          from_status: t.from_status,
          to_status: t.to_status,
          attempts: t.attempts,
          retry_cycle: t.retry_cycle,
          reason: t.reason,
          worker: t.worker,
          created_at: t.created_at,
        };
      });

      return rows.slice(0, limit);
    },
  });
}