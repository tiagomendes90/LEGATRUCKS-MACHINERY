// Resolve o conteúdo editorial de uma campanha num determinado idioma.
// Combina: tradução da campanha → conteúdo base → blocos do template → i18n.

import type { NewsletterI18n } from "./index.ts";

export interface CampaignTranslationRow {
  language_code: string;
  subject?: string | null;
  preheader?: string | null;
  title?: string | null;
  intro?: string | null;
  outro?: string | null;
  cta_label?: string | null;
  footer_note?: string | null;
}

export interface ResolvedCampaignContent {
  subject: string;
  preheader: string | null;
  title: string;
  intro: string;
  outro: string;
  ctaLabel: string;
  footerNote: string;
}

export interface TemplateBlocks {
  header?: string;
  footer?: string;
  intro?: string;
  outro?: string;
}

function firstNonEmpty(...vals: Array<string | null | undefined>): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return "";
}

/**
 * @param translations Todas as traduções da campanha (qualquer idioma).
 *                     A cadeia de fallback do i18n decide qual usar.
 */
export function resolveCampaignContent(
  campaign: Record<string, any>,
  lang: string,
  i18n: NewsletterI18n,
  translations: CampaignTranslationRow[] = [],
  template?: TemplateBlocks | null,
): ResolvedCampaignContent {
  const byLang = new Map(translations.map((t) => [t.language_code, t]));
  const chain = i18n.chain(lang);

  const fromChain = (field: keyof CampaignTranslationRow): string => {
    for (const c of chain) {
      const v = byLang.get(c)?.[field];
      if (typeof v === "string" && v.trim() !== "") return v;
    }
    return "";
  };

  const base = campaign?.content_json ?? {};
  const tpl = template ?? {};

  const subject = firstNonEmpty(fromChain("subject"), campaign?.subject, "LEGA");
  const title = firstNonEmpty(fromChain("title"), campaign?.title, subject);
  const preheaderRaw = firstNonEmpty(fromChain("preheader"), campaign?.preheader);

  return {
    subject,
    title,
    preheader: preheaderRaw || null,
    intro: firstNonEmpty(fromChain("intro"), base?.intro, tpl.intro),
    outro: firstNonEmpty(fromChain("outro"), base?.outro, tpl.outro),
    ctaLabel: firstNonEmpty(fromChain("cta_label"), i18n.t(lang, "product.cta")),
    footerNote: firstNonEmpty(fromChain("footer_note"), tpl.footer),
  };
}