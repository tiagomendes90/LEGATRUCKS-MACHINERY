// Motor de internacionalização da Newsletter.
//
// Arquitetura genérica: nada é específico de EN/PT/FR. Os idiomas vivem em
// `newsletter_languages` e os textos institucionais em `newsletter_translations`.
// A resolução de qualquer texto segue sempre a mesma cadeia:
//
//   idioma pedido → fallback_code do idioma (recursivo) → idioma por defeito
//   → defaults de código → chave vazia
//
// Adicionar espanhol/alemão/italiano é apenas inserir uma linha em
// `newsletter_languages` a partir do Admin.

import {
  DEFAULT_STRINGS,
  ROOT_FALLBACK_LANGUAGE,
  STRING_KEYS,
  type StringKey,
} from "./defaults.ts";

export { STRING_KEYS, STRING_LABELS } from "./defaults.ts";
export type { StringKey } from "./defaults.ts";

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

export interface NewsletterI18n {
  /** Idiomas ativos, já ordenados. */
  languages: NewsletterLanguage[];
  /** Todos os idiomas (inclui inativos) — usado pelo Admin. */
  allLanguages: NewsletterLanguage[];
  defaultLanguage: string;
  /** Normaliza um código arbitrário para um idioma ativo suportado. */
  resolve: (code?: string | null) => string;
  /** Cadeia de fallback completa para um idioma. */
  chain: (code: string) => string[];
  /** Texto institucional traduzido, com interpolação `{var}`. */
  t: (code: string, key: StringKey, vars?: Record<string, string | number>) => string;
  language: (code: string) => NewsletterLanguage | undefined;
}

function interpolate(tpl: string, vars?: Record<string, string | number>): string {
  if (!vars) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

const FALLBACK_LANGUAGE: NewsletterLanguage = {
  code: ROOT_FALLBACK_LANGUAGE,
  label: "English",
  native_label: "English",
  flag_emoji: "🇬🇧",
  locale: "en-GB",
  is_active: true,
  is_default: true,
  fallback_code: null,
  sort_order: 0,
};

/** Carrega idiomas + traduções (uma única vez por execução). */
export async function loadNewsletterI18n(supabase: any): Promise<NewsletterI18n> {
  const [{ data: langRows }, { data: trRows }] = await Promise.all([
    supabase.from("newsletter_languages").select("*").order("sort_order", { ascending: true }),
    supabase.from("newsletter_translations").select("language_code, key, value"),
  ]);

  const allLanguages: NewsletterLanguage[] =
    ((langRows ?? []) as NewsletterLanguage[]).length > 0
      ? (langRows as NewsletterLanguage[])
      : [FALLBACK_LANGUAGE];
  const languages = allLanguages.filter((l) => l.is_active);
  const active = languages.length > 0 ? languages : allLanguages;

  const defaultLanguage =
    active.find((l) => l.is_default)?.code ?? active[0]?.code ?? ROOT_FALLBACK_LANGUAGE;

  const byCode = new Map(allLanguages.map((l) => [l.code, l]));

  // overrides[lang][key] = value
  const overrides: Record<string, Record<string, string>> = {};
  for (const row of (trRows ?? []) as Array<{ language_code: string; key: string; value: string }>) {
    if (!row?.language_code || !row?.key) continue;
    if (typeof row.value !== "string" || row.value.trim() === "") continue;
    (overrides[row.language_code] ??= {})[row.key] = row.value;
  }

  const chain = (code: string): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    let cur: string | null | undefined = code;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      out.push(cur);
      cur = byCode.get(cur)?.fallback_code ?? null;
    }
    for (const extra of [defaultLanguage, ROOT_FALLBACK_LANGUAGE]) {
      if (extra && !seen.has(extra)) {
        seen.add(extra);
        out.push(extra);
      }
    }
    return out;
  };

  const resolve = (code?: string | null): string => {
    const c = (code ?? "").trim().toLowerCase().split(/[-_]/)[0];
    if (c && active.some((l) => l.code === c)) return c;
    return defaultLanguage;
  };

  const t = (code: string, key: StringKey, vars?: Record<string, string | number>): string => {
    for (const c of chain(code)) {
      const v = overrides[c]?.[key] ?? DEFAULT_STRINGS[c]?.[key];
      if (v) return interpolate(v, vars);
    }
    const root = DEFAULT_STRINGS[ROOT_FALLBACK_LANGUAGE]?.[key];
    return root ? interpolate(root, vars) : "";
  };

  return {
    languages: active,
    allLanguages,
    defaultLanguage,
    resolve,
    chain,
    t,
    language: (code: string) => byCode.get(code),
  };
}

/** Conjunto completo de chaves — reexportado para o Admin. */
export const ALL_STRING_KEYS: readonly StringKey[] = STRING_KEYS;

/* ------------------------------------------------------------------ */
/* Conteúdo de produto                                                 */
/* ------------------------------------------------------------------ */

export interface ProductContent {
  title: string;
  description: string;
  /** Idioma efetivamente usado (pode diferir do pedido, via fallback). */
  titleLanguage: string;
  descriptionLanguage: string;
}

/**
 * Resolve título/descrição de um produto no idioma pedido.
 * Usa `product_translations` quando existe; caso contrário percorre a cadeia
 * de fallback e, em último caso, o conteúdo original do produto.
 * Nunca devolve vazio se existir conteúdo original.
 */
export function resolveProductContent(
  product: Record<string, unknown>,
  lang: string,
  i18n: NewsletterI18n,
): ProductContent {
  const rows = ((product?.translations as any[]) ?? []).filter(Boolean);
  const byLang = new Map<string, any>(rows.map((r) => [String(r.language_code), r]));

  const pick = (field: "title" | "description"): [string, string] => {
    for (const c of i18n.chain(lang)) {
      const v = byLang.get(c)?.[field];
      if (typeof v === "string" && v.trim() !== "") return [v.trim(), c];
    }
    const original = product?.[field];
    return [typeof original === "string" ? original : "", "source"];
  };

  const [title, titleLanguage] = pick("title");
  const [description, descriptionLanguage] = pick("description");
  return { title, description, titleLanguage, descriptionLanguage };
}