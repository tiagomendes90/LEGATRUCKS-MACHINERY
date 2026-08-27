import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TaxonomyTranslationRow {
  entity_type: "category" | "subcategory";
  entity_id: string;
  language_code: string;
  name: string;
}

/**
 * Carrega, uma única vez por sessão, todas as traduções de
 * categorias/subcategorias. Tabela minúscula → sem custo e sem N+1.
 */
export function useTaxonomyTranslations() {
  return useQuery({
    queryKey: ["taxonomy-translations"],
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: async (): Promise<TaxonomyTranslationRow[]> => {
      const { data, error } = await (supabase as any)
        .from("taxonomy_translations")
        .select("entity_type, entity_id, language_code, name");
      if (error) throw error;
      return (data ?? []) as TaxonomyTranslationRow[];
    },
  });
}
