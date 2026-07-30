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
  list_id: string | null;
  template_id: string | null;
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
  tags?: string[] | null;
}

export interface NewsletterList {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsletterTemplate {
  id: string;
  key: string;
  name: string;
  description: string | null;
  template_key: string;
  subject_template: string | null;
  preheader_template: string | null;
  content_json: { intro?: string; outro?: string } | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsletterAutomation {
  id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  list_id: string | null;
  template_id: string | null;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
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
  list_id?: string | null;
  template_id?: string | null;
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
        list_id: draft.list_id ?? null,
        template_id: draft.template_id ?? null,
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

/* ------------------------------------------------------------------ */
/* Listas (segmentação)                                                */
/* ------------------------------------------------------------------ */

export function useLists() {
  return useQuery({
    queryKey: ["newsletter_lists"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("newsletter_lists")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as NewsletterList[];
    },
  });
}

/** Contagem de membros por lista (subscritores ativos). */
export function useListMemberCounts() {
  return useQuery({
    queryKey: ["newsletter_list_counts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("newsletter_list_subscribers")
        .select("list_id, subscriber:newsletter_subscribers(status)")
        .limit(5000);
      if (error) throw error;
      const counts: Record<string, { total: number; active: number }> = {};
      for (const row of (data ?? []) as any[]) {
        const bucket = (counts[row.list_id] ??= { total: 0, active: 0 });
        bucket.total += 1;
        if (row.subscriber?.status === "active") bucket.active += 1;
      }
      return counts;
    },
  });
}

export function useSaveList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (list: Partial<NewsletterList> & { name: string; key: string }) => {
      const payload = {
        key: list.key,
        name: list.name,
        description: list.description ?? null,
        is_active: list.is_active ?? true,
      };
      if (list.id) {
        const { data, error } = await (supabase as any)
          .from("newsletter_lists").update(payload).eq("id", list.id).select("*").maybeSingle();
        if (error) throw error;
        return data as NewsletterList;
      }
      const { data, error } = await (supabase as any)
        .from("newsletter_lists").insert(payload).select("*").maybeSingle();
      if (error) throw error;
      return data as NewsletterList;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["newsletter_lists"] }),
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("newsletter_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["newsletter_lists"] });
      qc.invalidateQueries({ queryKey: ["newsletter_list_counts"] });
    },
  });
}

/** Adiciona/remove subscritores de uma lista (segmentação manual). */
export function useSetListMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      subscriberIds,
      action,
    }: { listId: string; subscriberIds: string[]; action: "add" | "remove" }) => {
      if (subscriberIds.length === 0) return;
      if (action === "add") {
        const { error } = await (supabase as any)
          .from("newsletter_list_subscribers")
          .upsert(
            subscriberIds.map((sid) => ({ list_id: listId, subscriber_id: sid })),
            { onConflict: "list_id,subscriber_id", ignoreDuplicates: true },
          );
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("newsletter_list_subscribers")
          .delete()
          .eq("list_id", listId)
          .in("subscriber_id", subscriberIds);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["newsletter_list_counts"] }),
  });
}

/* ------------------------------------------------------------------ */
/* Templates reutilizáveis                                             */
/* ------------------------------------------------------------------ */

export function useTemplates() {
  return useQuery({
    queryKey: ["newsletter_templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("newsletter_templates")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as NewsletterTemplate[];
    },
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tpl: Partial<NewsletterTemplate> & { name: string; key: string }) => {
      const payload = {
        key: tpl.key,
        name: tpl.name,
        description: tpl.description ?? null,
        template_key: tpl.template_key ?? "product_showcase_v1",
        subject_template: tpl.subject_template ?? null,
        preheader_template: tpl.preheader_template ?? null,
        content_json: tpl.content_json ?? {},
        is_active: tpl.is_active ?? true,
      };
      if (tpl.id) {
        const { data, error } = await (supabase as any)
          .from("newsletter_templates").update(payload).eq("id", tpl.id).select("*").maybeSingle();
        if (error) throw error;
        return data as NewsletterTemplate;
      }
      const { data, error } = await (supabase as any)
        .from("newsletter_templates").insert(payload).select("*").maybeSingle();
      if (error) throw error;
      return data as NewsletterTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["newsletter_templates"] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("newsletter_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["newsletter_templates"] }),
  });
}

/** Duplica uma campanha existente como novo rascunho (campanhas reutilizáveis). */
export function useDuplicateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: NewsletterCampaign) => {
      const { data, error } = await (supabase as any)
        .from("newsletter_campaigns")
        .insert({
          title: `${campaign.title} (cópia)`,
          subject: campaign.subject,
          preheader: campaign.preheader,
          product_ids: campaign.product_ids ?? [],
          content_json: campaign.content_json ?? {},
          template_key: campaign.template_key,
          template_id: campaign.template_id ?? null,
          list_id: campaign.list_id ?? null,
          status: "draft",
        })
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as NewsletterCampaign;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["newsletter_campaigns"] }),
  });
}

/* ------------------------------------------------------------------ */
/* Automações (scaffold — sem execução nesta fase)                     */
/* ------------------------------------------------------------------ */

export function useAutomations() {
  return useQuery({
    queryKey: ["newsletter_automations"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("newsletter_automations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NewsletterAutomation[];
    },
  });
}

const _legacyPreview = async (input: {
  campaign_id?: string;
  draft?: {
    title: string;
    subject: string;
    preheader?: string | null;
    product_ids: string[];
    content_json: NewsletterCampaign["content_json"];
  };
}): Promise<{ html: string; subject: string; product_count: number }> => {
  const { data, error } = await supabase.functions.invoke("newsletter-preview", {
    body: input,
  });
  if (error) throw error;
  if (!data?.ok) throw new Error((data as any)?.error ?? "preview_failed");
  return data as { html: string; subject: string; product_count: number };
};