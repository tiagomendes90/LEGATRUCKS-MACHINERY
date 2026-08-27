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
    (entity: TranslatableTaxonomy | null | undefined) =>
      resolveTaxonomyName(entity, language, staticBySlug),
    [language, staticBySlug],
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
