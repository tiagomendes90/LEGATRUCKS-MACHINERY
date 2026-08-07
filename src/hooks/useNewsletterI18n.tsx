import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/admin/supabaseClient";

export interface NewsletterLanguage {
  code: string;
  label: string;
  native_label: string;
  flag_emoji: string | null;
  locale: string | null;
  is_active: boolean;
  is_default: boolean;
  fallback_code: string | null;
  sort_order: number;
}

export interface NewsletterStringRow {
  id?: string;
  language_code: string;
  key: string;
  value: string;
}

export interface CampaignTranslation {
  id?: string;
  campaign_id: string;
  language_code: string;
  subject: string | null;
  preheader: string | null;
  title: string | null;
  intro: string | null;
  outro: string | null;
  cta_label: string | null;
  footer_note: string | null;
  is_auto_translated?: boolean;
}

/* ---------------- Idiomas ---------------- */

export function useNewsletterLanguages(includeInactive = true) {
  return useQuery({
    queryKey: ["newsletter-languages", includeInactive],
    queryFn: async () => {
      let q = supabase.from("newsletter_languages").select("*").order("sort_order");
      if (!includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as NewsletterLanguage[];
    },
  });
}

export function useSaveLanguage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lang: Partial<NewsletterLanguage> & { code: string }) => {
      const { data, error } = await supabase
        .from("newsletter_languages")
        .upsert(lang as any, { onConflict: "code" })
        .select()
        .single();
      if (error) throw error;
      return data as NewsletterLanguage;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["newsletter-languages"] }),
  });
}

export function useDeleteLanguage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.from("newsletter_languages").delete().eq("code", code);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["newsletter-languages"] }),
  });
}

export function useSetDefaultLanguage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { error: clear } = await supabase
        .from("newsletter_languages")
        .update({ is_default: false })
        .neq("code", code);
      if (clear) throw clear;
      const { error } = await supabase
        .from("newsletter_languages")
        .update({ is_default: true, is_active: true })
        .eq("code", code);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["newsletter-languages"] }),
  });
}

/* ---------------- Textos institucionais ---------------- */

export function useNewsletterStrings() {
  return useQuery({
    queryKey: ["newsletter-strings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_translations")
        .select("id, language_code, key, value");
      if (error) throw error;
      return (data ?? []) as NewsletterStringRow[];
    },
  });
}

export function useSaveNewsletterStrings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: NewsletterStringRow[]) => {
      const toUpsert = rows.filter((r) => (r.value ?? "").trim() !== "");
      const toDelete = rows.filter((r) => (r.value ?? "").trim() === "" && r.id);
      if (toUpsert.length) {
        const { error } = await supabase
          .from("newsletter_translations")
          .upsert(
            toUpsert.map((r) => ({ language_code: r.language_code, key: r.key, value: r.value })),
            { onConflict: "language_code,key" },
          );
        if (error) throw error;
      }
      for (const r of toDelete) {
        await supabase.from("newsletter_translations").delete().eq("id", r.id!);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["newsletter-strings"] }),
  });
}

/* ---------------- Traduções de campanha ---------------- */

export function useCampaignTranslations(campaignId?: string | null) {
  return useQuery({
    queryKey: ["campaign-translations", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_campaign_translations")
        .select("*")
        .eq("campaign_id", campaignId!);
      if (error) throw error;
      return (data ?? []) as CampaignTranslation[];
    },
  });
}

export function useSaveCampaignTranslation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: CampaignTranslation) => {
      const { data, error } = await supabase
        .from("newsletter_campaign_translations")
        .upsert(
          {
            campaign_id: row.campaign_id,
            language_code: row.language_code,
            subject: row.subject,
            preheader: row.preheader,
            title: row.title,
            intro: row.intro,
            outro: row.outro,
            cta_label: row.cta_label,
            footer_note: row.footer_note,
          },
          { onConflict: "campaign_id,language_code" },
        )
        .select()
        .single();
      if (error) throw error;
      return data as CampaignTranslation;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["campaign-translations", vars.campaign_id] }),
  });
}
