import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/admin/supabaseClient";
import { emitPublishingEvent } from "@/lib/publishing";

export interface SocialProductRow {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  year: number | null;
  description: string | null;
  social_status: string;
  social_hash: string | null;
  social_caption: string | null;
  is_active: boolean | null;
  brand: { name: string | null; slug: string | null } | null;
  images: Array<{ image_url: string; is_primary: boolean | null; sort_order: number | null }>;
}

export interface SocialPostRow {
  id: string;
  product_id: string;
  channel_key: string;
  external_id: string | null;
  external_url: string | null;
  status: string;
  published_at: string;
  media: Record<string, unknown> | null;
}

export interface HashAuditRow {
  id: string;
  product_id: string;
  old_hash: string | null;
  new_hash: string | null;
  changed_fields: unknown;
  created_at: string;
}

/** Products currently in a social-relevant state. */
export function useSocialProducts() {
  return useQuery({
    queryKey: ["social_products"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, title, price, currency, year, description, social_status, social_hash, social_caption, is_active, brand:brands(name, slug), images:product_images(image_url, is_primary, sort_order)"
        )
        .in("social_status", ["ready_for_social", "published", "outdated"])
        .eq("is_active", true)
        .order("social_status", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SocialProductRow[];
    },
  });
}

export function useSocialPosts(productId: string | null) {
  return useQuery({
    queryKey: ["social_posts", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("product_social_posts")
        .select("*")
        .eq("product_id", productId!)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SocialPostRow[];
    },
  });
}

export function useLatestHashAudit(productId: string | null) {
  return useQuery({
    queryKey: ["social_hash_audit", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("product_social_hash_audit")
        .select("*")
        .eq("product_id", productId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as HashAuditRow | null;
    },
  });
}

/** Persist admin-edited caption on the product. */
export function useSaveCaption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, caption }: { productId: string; caption: string }) => {
      const { error } = await supabase
        .from("products")
        .update({ social_caption: caption })
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social_products"] }),
  });
}

interface PublishArgs {
  productId: string;
  channel: string;
  caption?: string;
  imageUrl?: string | null;
  republish?: boolean;
  deletePrevious?: boolean;
}

export function usePublishToSocial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      channel,
      caption,
      imageUrl,
      republish,
      deletePrevious,
    }: PublishArgs) => {
      if (caption) {
        await supabase
          .from("products")
          .update({ social_caption: caption })
          .eq("id", productId);
      }
      const payload: Record<string, unknown> = { channel };
      if (caption) payload.caption = caption;
      if (imageUrl) payload.image_url = imageUrl;
      if (deletePrevious) payload.delete_previous = true;
      const type = republish ? "social.republish" : "social.publish.confirmed";
      return emitPublishingEvent({ type: type as any, productId, payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social_products"] });
      qc.invalidateQueries({ queryKey: ["social_posts"] });
      qc.invalidateQueries({ queryKey: ["publishing_events"] });
    },
  });
}

export function useDeleteSocial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      channel,
      externalId,
    }: {
      productId: string;
      channel: string;
      externalId?: string | null;
    }) => {
      return emitPublishingEvent({
        type: "social.delete",
        productId,
        payload: {
          channel,
          ...(externalId ? { external_id: externalId } : {}),
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social_products"] });
      qc.invalidateQueries({ queryKey: ["social_posts"] });
      qc.invalidateQueries({ queryKey: ["publishing_events"] });
    },
  });
}

/** Admin accepts outdated content as-is: sync hash without republishing. */
export function useAcceptOutdated() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await supabase
        .from("products")
        .select("social_hash")
        .eq("id", productId)
        .maybeSingle();
      await supabase
        .from("products")
        .update({ social_status: "published" })
        .eq("id", productId);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social_products"] }),
  });
}
