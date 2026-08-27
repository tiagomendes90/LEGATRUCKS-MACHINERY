import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  normalizeLanguage,
  productFields,
  resolveProductContent,
  resolveSpecValue,
  resolveTaxonomyName,
  type AppLanguage,
  type ResolvedProductContent,
  type TranslatableProduct,
  type TranslatableTaxonomy,
} from "@/lib/i18n/productContent";
import { useTaxonomyTranslations } from "@/hooks/useTaxonomyTranslations";

/** Dicionário estático já existente para as categorias principais. */
const CATEGORY_NAV_KEY: Record<string, string> = {
  camioes: "nav.trucks",
  maquinas: "nav.machinery",
  tractores: "nav.tractors",
  reboques: "nav.trailers",
  pecas: "nav.parts",
  vans: "nav.vans",
};

/**
 * Idioma activo do site + utilitários para obter o conteúdo dos produtos
 * já resolvido. Sem chamadas de rede: opera sobre dados já carregados.
 */
export function useProductLanguage() {
  const { i18n, t } = useTranslation();
  const language = normalizeLanguage(i18n.language) as AppLanguage;
  const { data: taxonomyRows } = useTaxonomyTranslations();

  // Mapa entity_id|lang -> nome traduzido (uma só passagem, memoizado).
  const taxonomyMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of taxonomyRows ?? []) {
      m.set(`${r.entity_id}|${normalizeLanguage(r.language_code)}`, r.name);
    }
    return m;
  }, [taxonomyRows]);

  const staticBySlug = useCallback(
    (slug: string) => {
      const key = CATEGORY_NAV_KEY[slug];
      if (!key) return null;
      const value = t(key);
      return value === key ? null : value;
    },
    [t],
  );

  const tp = useCallback(
    (product: TranslatableProduct | null | undefined): ResolvedProductContent =>
      resolveProductContent(product, language),
    [language],
  );

  const tTitle = useCallback(
    (product: TranslatableProduct | null | undefined) => tp(product).title,
    [tp],
  );

  const tTaxonomy = useCallback(
    (entity: TranslatableTaxonomy | null | undefined) => {
      if (!entity) return "";
      const id = (entity as any).id as string | undefined;
      const fromDb = id ? taxonomyMap.get(`${id}|${language}`) : undefined;
      if (fromDb && fromDb.trim() !== "") return fromDb;
      return resolveTaxonomyName(entity, language, staticBySlug);
    },
    [language, staticBySlug, taxonomyMap],
  );

  const tSpec = useCallback(
    (
      value: string | null | undefined,
      product?: TranslatableProduct | null,
    ) => resolveSpecValue(value, language, product ? productFields(product, language) : null),
    [language],
  );

  return useMemo(
    () => ({ language, tp, tTitle, tTaxonomy, tSpec }),
    [language, tp, tTitle, tTaxonomy, tSpec],
  );
}
