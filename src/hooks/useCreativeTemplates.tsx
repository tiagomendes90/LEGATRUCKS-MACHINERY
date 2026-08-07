import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_CONFIG,
  type CreativeKind,
  type CreativeTemplate,
  type TemplateConfig,
} from "@/lib/creative/types";
import {
  PRODUCT_CREATIVE_SELECT,
  buildCreativeData,
} from "@/lib/creative/creativeData";
import type { CreativeData } from "@/lib/creative/types";

const normalize = (row: any): CreativeTemplate => ({
  ...row,
  config: { ...DEFAULT_CONFIG, ...((row?.config ?? {}) as TemplateConfig) },
});

export function useCreativeTemplates(kind?: CreativeKind) {
  return useQuery({
    queryKey: ["creative_templates", kind ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("creative_templates")
        .select("*")
        .order("kind", { ascending: true })
        .order("sort_order", { ascending: true });
      if (kind) q = q.eq("kind", kind);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(normalize);
    },
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tpl: Partial<CreativeTemplate> & { id?: string }) => {
      const payload = {
        name: tpl.name,
        kind: tpl.kind,
        description: tpl.description ?? null,
        is_active: tpl.is_active ?? true,
        sort_order: tpl.sort_order ?? 0,
        config: tpl.config as any,
      };
      if (tpl.id) {
        const { error } = await supabase
          .from("creative_templates")
          .update(payload)
          .eq("id", tpl.id);
        if (error) throw error;
        return tpl.id;
      }
      const { data, error } = await supabase
        .from("creative_templates")
        .insert(payload as any)
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creative_templates"] }),
  });
}

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tpl: CreativeTemplate) => {
      const { error } = await supabase.from("creative_templates").insert({
        name: `${tpl.name} (cópia)`,
        kind: tpl.kind,
        description: tpl.description,
        is_active: false,
        is_default: false,
        sort_order: (tpl.sort_order ?? 0) + 1,
        config: tpl.config as any,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creative_templates"] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("creative_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creative_templates"] }),
  });
}

export function useToggleTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("creative_templates")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creative_templates"] }),
  });
}

export function useSetDefaultTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tpl: CreativeTemplate) => {
      const { error: clearError } = await supabase
        .from("creative_templates")
        .update({ is_default: false })
        .eq("kind", tpl.kind)
        .eq("is_default", true);
      if (clearError) throw clearError;
      const { error } = await supabase
        .from("creative_templates")
        .update({ is_default: true, is_active: true })
        .eq("id", tpl.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creative_templates"] }),
  });
}

export interface MediaStudioProduct {
  id: string;
  title: string;
  is_active: boolean | null;
  data: CreativeData;
}

/** Produtos ativos com os mesmos dados usados por Posts e Newsletter. */
export function useMediaStudioProducts() {
  return useQuery({
    queryKey: ["media_studio_products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_CREATIVE_SELECT)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as any[]).map((p) => ({
        id: p.id as string,
        title: p.title as string,
        is_active: p.is_active as boolean | null,
        data: buildCreativeData(p),
      })) as MediaStudioProduct[];
    },
  });
}

export interface SavedCreative {
  id: string;
  product_id: string;
  template_id: string | null;
  kind: CreativeKind;
  label: string | null;
  image_url: string | null;
  fields: Record<string, boolean>;
  created_at: string;
}

export function useSavedCreatives(productId?: string | null) {
  return useQuery({
    queryKey: ["product_creatives", productId ?? "none"],
    enabled: Boolean(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_creatives")
        .select("*")
        .eq("product_id", productId as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SavedCreative[];
    },
  });
}

export function useSaveCreative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      product_id: string;
      template_id: string | null;
      kind: CreativeKind;
      label: string;
      image_url: string | null;
      fields: Record<string, boolean>;
    }) => {
      const { error } = await supabase
        .from("product_creatives")
        .insert(payload as any);
      if (error) throw error;
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["product_creatives", v.product_id] }),
  });
}

export function useDeleteCreative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: SavedCreative) => {
      const { error } = await supabase
        .from("product_creatives")
        .delete()
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: (_d, row) =>
      qc.invalidateQueries({ queryKey: ["product_creatives", row.product_id] }),
  });
}
