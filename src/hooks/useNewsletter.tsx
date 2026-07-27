import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/admin/supabaseClient";
import { emitPublishingEvent } from "@/lib/publishing";

export interface NewsletterCampaign {
  id: string;
  title: string;
  subject: string;
  preheader: string | null;
  status: string;
  product_ids: string[];
  template_key: string;
  content_json: {
    intro?: string;
    outro?: string;
    overrides?: Record<string, { title?: string; description?: string; cta?: string }>;
  } | null;
  content_html: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  broadcast_id: string | null;
  last_error: string | null;
  stats: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  consent: boolean;
  source: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  unsubscribe_token: string;
}

export interface NewsletterSend {
  id: string;
  campaign_id: string;
  status: string;
  broadcast_id: string | null;
  recipients_count: number | null;
  error: string | null;
  raw_response: Record<string, unknown>;
  sent_at: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

export function useCampaigns() {
  return useQuery({
    queryKey: ["newsletter_campaigns"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("newsletter_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NewsletterCampaign[];
    },
  });
}

export function useSubscribers() {
  return useQuery({
    queryKey: ["newsletter_subscribers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as NewsletterSubscriber[];
    },
  });
}

export function useSubscriberStats() {
  return useQuery({
    queryKey: ["newsletter_subscribers_stats"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("newsletter_subscribers")
        .select("status");
      if (error) throw error;
      const rows = (data ?? []) as { status: string }[];
      return {
        total: rows.length,
        active: rows.filter((r) => r.status === "active").length,
        unsubscribed: rows.filter((r) => r.status === "unsubscribed").length,
        bounced: rows.filter((r) => r.status === "bounced").length,
      };
    },
  });
}

export function useCampaignSends(campaignId: string | null) {
  return useQuery({
    queryKey: ["newsletter_sends", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("newsletter_sends")
        .select("*")
        .eq("campaign_id", campaignId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NewsletterSend[];
    },
  });
}

export function usePublishableProducts() {
  return useQuery({
    queryKey: ["newsletter_selectable_products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, price, currency, year, brand:brands(name), images:product_images(image_url, is_primary, sort_order)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export interface CampaignDraft {
  id?: string | null;
  title: string;
  subject: string;
  preheader?: string | null;
  product_ids: string[];
  content_json: NewsletterCampaign["content_json"];
  status?: string;
}

export function useSaveCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: CampaignDraft) => {
      const payload = {
        title: draft.title,
        subject: draft.subject,
        preheader: draft.preheader ?? null,
        product_ids: draft.product_ids,
        content_json: draft.content_json ?? {},
        status: draft.status ?? "draft",
      };
      if (draft.id) {
        const { data, error } = await (supabase as any)
          .from("newsletter_campaigns")
          .update(payload)
          .eq("id", draft.id)
          .select("*")
          .maybeSingle();
        if (error) throw error;
        return data as NewsletterCampaign;
      }
      const { data, error } = await (supabase as any)
        .from("newsletter_campaigns")
        .insert(payload)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as NewsletterCampaign;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["newsletter_campaigns"] }),
  });
}

export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      // dedupe on campaign id — prevents accidental double-send
      return emitPublishingEvent({
        type: "newsletter.campaign.send",
        payload: { campaign_id: campaignId },
        dedupeKey: `newsletter:send:${campaignId}`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["newsletter_campaigns"] });
      qc.invalidateQueries({ queryKey: ["publishing_events"] });
    },
  });
}

export function useCancelCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      return emitPublishingEvent({
        type: "newsletter.campaign.cancel",
        payload: { campaign_id: campaignId },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["newsletter_campaigns"] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await (supabase as any)
        .from("newsletter_campaigns")
        .delete()
        .eq("id", campaignId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["newsletter_campaigns"] }),
  });
}

export function useAdminUnsubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subscriberId: string) => {
      const { error } = await (supabase as any)
        .from("newsletter_subscribers")
        .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
        .eq("id", subscriberId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["newsletter_subscribers"] });
      qc.invalidateQueries({ queryKey: ["newsletter_subscribers_stats"] });
    },
  });
}

/** Renders campaign HTML via the newsletter-preview edge function. */
export async function fetchCampaignPreview(input: {
  campaign_id?: string;
  draft?: {
    title: string;
    subject: string;
    preheader?: string | null;
    product_ids: string[];
    content_json: NewsletterCampaign["content_json"];
  };
}): Promise<{ html: string; subject: string; product_count: number }> {
  const { data, error } = await supabase.functions.invoke("newsletter-preview", {
    body: input,
  });
  if (error) throw error;
  if (!data?.ok) throw new Error((data as any)?.error ?? "preview_failed");
  return data as { html: string; subject: string; product_count: number };
}