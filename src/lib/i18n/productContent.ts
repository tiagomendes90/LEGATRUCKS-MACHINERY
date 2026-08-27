/**
 * Camada central de resolução linguística do conteúdo dos produtos.
 *
 * Funções puras: não fazem chamadas de rede nem tocam nos dados originais.
 * Usada pelo site público, pelo admin e (via equivalente no edge) pela
 * newsletter, garantindo que todos mostram exactamente o mesmo texto.
 */

export type AppLanguage = "pt" | "en" | "fr";

export const APP_LANGUAGES: AppLanguage[] = ["pt", "en", "fr"];

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  pt: "Português",
  en: "English",
  fr: "Français",
};

/** Normaliza qualquer código i18next (`en-GB`, `PT`, …) para o idioma suportado. */
export function normalizeLanguage(code?: string | null): AppLanguage {
  const base = (code ?? "").toLowerCase().split(/[-_]/)[0];
  return (APP_LANGUAGES as string[]).includes(base) ? (base as AppLanguage) : "pt";
}

export interface ProductTranslationRow {
  language_code: string;
  title?: string | null;
  description?: string | null;
  fields?: Record<string, unknown> | null;
}

export interface TranslatableProduct {
  title?: string | null;
  description?: string | null;
  translations?: ProductTranslationRow[] | null;
  [key: string]: unknown;
}

export interface ResolvedProductContent {
  title: string;
  description: string;
  /** true quando se usou o conteúdo original por falta de tradução. */
  isFallback: boolean;
  language: AppLanguage;
}

function pickRow(
  translations: ProductTranslationRow[] | null | undefined,
  lang: AppLanguage,
): ProductTranslationRow | undefined {
  return (translations ?? []).find(
    (t) => normalizeLanguage(t.language_code) === lang,
  );
}

function nonEmpty(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

/**
 * Resolve título e descrição para o idioma pedido.
 * Ordem: tradução do idioma → conteúdo original → vazio.
 * O original vem antes de qualquer outro idioma, para que PT nunca
 * apareça em inglês só porque existe uma tradução EN.
 */
export function resolveProductContent(
  product: TranslatableProduct | null | undefined,
  language: string | AppLanguage,
): ResolvedProductContent {
  const lang = normalizeLanguage(language as string);
  const row = pickRow(product?.translations, lang);

  const trTitle = nonEmpty(row?.title);
  const trDesc = nonEmpty(row?.description);
  const origTitle = nonEmpty(product?.title) ?? "";
  const origDesc = nonEmpty(product?.description) ?? "";

  return {
    title: trTitle ?? origTitle,
    description: trDesc ?? origDesc,
    isFallback: (!trTitle && !!origTitle) || (!trDesc && !!origDesc),
    language: lang,
  };
}

/** Atalho para o título — o caso mais comum nos cartões. */
export function productTitle(
  product: TranslatableProduct | null | undefined,
  language: string | AppLanguage,
): string {
  return resolveProductContent(product, language).title;
}

/* ------------------------------------------------------------------ */
/*  Taxonomia (categorias / subcategorias)                             */
/* ------------------------------------------------------------------ */

export interface TaxonomyTranslationRow {
  language_code: string;
  name?: string | null;
}

export interface TranslatableTaxonomy {
  name?: string | null;
  slug?: string | null;
  translations?: TaxonomyTranslationRow[] | null;
  [key: string]: unknown;
}

/**
 * Nome traduzido de uma categoria/subcategoria.
 * Ordem: tradução do idioma → dicionário estático opcional (slug) → nome original.
 */
export function resolveTaxonomyName(
  entity: TranslatableTaxonomy | null | undefined,
  language: string | AppLanguage,
  staticBySlug?: (slug: string) => string | null | undefined,
): string {
  if (!entity) return "";
  const lang = normalizeLanguage(language as string);
  const row = (entity.translations ?? []).find(
    (t) => normalizeLanguage(t.language_code) === lang,
  );
  const translated = nonEmpty(row?.name);
  if (translated) return translated;
  if (entity.slug && staticBySlug) {
    const s = nonEmpty(staticBySlug(entity.slug));
    if (s) return s;
  }
  return nonEmpty(entity.name) ?? "";
}

/* ------------------------------------------------------------------ */
/*  Especificações                                                     */
/* ------------------------------------------------------------------ */

/**
 * Um valor é considerado técnico (nunca traduzível) quando contém dígitos,
 * é muito curto, ou parece um código/URL/referência.
 */
export function isTechnicalValue(value: unknown): boolean {
  if (typeof value !== "string") return true;
  const v = value.trim();
  if (v === "" || v.length < 3) return true;
  if (/\d/.test(v)) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (/^[A-Z0-9._/-]+$/.test(v)) return true; // referências e códigos
  return false;
}

/**
 * Valor textual de uma especificação no idioma pedido.
 * Só traduz texto verdadeiramente linguístico; tudo o resto passa intacto.
 */
export function resolveSpecValue(
  value: string | null | undefined,
  language: string | AppLanguage,
  fields?: Record<string, unknown> | null,
): string {
  const raw = value ?? "";
  if (isTechnicalValue(raw)) return raw;
  const key = `spec:${raw.trim().toLowerCase()}`;
  const translated = fields ? nonEmpty(fields[key]) : null;
  return translated ?? raw;
}

/** Campos traduzidos (jsonb) do produto para o idioma pedido. */
export function productFields(
  product: TranslatableProduct | null | undefined,
  language: string | AppLanguage,
): Record<string, unknown> {
  const row = pickRow(product?.translations, normalizeLanguage(language as string));
  return (row?.fields ?? {}) as Record<string, unknown>;
}
