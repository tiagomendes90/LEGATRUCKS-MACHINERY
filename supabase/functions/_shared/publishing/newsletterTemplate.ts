// Shared HTML renderer for newsletter campaigns. Used both by the
// admin preview endpoint and by the `newsletter` channel adapter.
// Pure string templating — no external deps so it runs in Deno.
//
// Identidade visual alinhada com o website LEGA:
//  - logótipo oficial (public/lovable-uploads/9a1d192d-…png, o mesmo do header/footer)
//  - laranja institucional #F97316 (Tailwind orange-500 usado no site)
//  - links de produto via /vehicle/{id} (mesma rota da SPA)

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://www.lega.pt";
import { orderedImageUrls, specPairs } from "./productQuery.ts";
import {
  type NewsletterI18n,
  resolveProductContent,
  translateTerm,
  type StringKey,
} from "./i18n/index.ts";
import {
  resolveCampaignContent,
  type CampaignTranslationRow,
} from "./i18n/campaignContent.ts";
import { newsletterViewUrl } from "./i18n/urls.ts";

/** Mesmo asset do header e footer do website. */
const LOGO_URL = `${SITE_URL}/lovable-uploads/9a1d192d-e9d6-4064-944c-c583427ab323.png`;

const BRAND = "#f97316"; // orange-500
const BRAND_DARK = "#c2410c"; // orange-700
const INK = "#0f172a";
const BODY = "#334155";
const MUTED = "#64748b";
const LINE = "#e9edf3";
const CANVAS = "#f4f5f7";
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const PHONE_DISPLAY = "+351 912 406 089";
const PHONE_TEL = "+351912406089";
const EMAIL = "info@lega.pt";
const ADDRESS = "Travessa do Monte, nº 560, 4765-326 Oliveira Santa Maria, Vila Nova de Famalicão, Portugal";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61573724754152";
const INSTAGRAM_URL = "https://www.instagram.com/lega_trucks_and_machinery/";
const LINKEDIN_URL = Deno.env.get("LEGA_LINKEDIN_URL") ?? "";
const WHATSAPP_URL = "https://wa.me/351912406089";

type AnyRecord = Record<string, unknown>;

export interface CampaignInput {
  title?: string;
  subject: string;
  preheader?: string | null;
  content_json?: {
    intro?: string;
    outro?: string;
    overrides?: Record<string, { title?: string; description?: string; cta?: string }>;
  } | null;
}

/** Blocos reutilizáveis provenientes de um newsletter_template. */
export interface TemplateBlocks {
  header?: string;
  footer?: string;
  intro?: string;
  outro?: string;
}

export interface RenderOptions {
  campaign: CampaignInput;
  products: AnyRecord[];
  /** Template reutilizável — usado como fallback do conteúdo da campanha. */
  template?: TemplateBlocks | null;
  unsubscribeUrl?: string; // Falls back to Resend placeholder
  /** Motor i18n carregado da BD. */
  i18n: NewsletterI18n;
  /** Idioma desta versão da newsletter. */
  lang: string;
  /** Traduções da campanha (qualquer idioma — a cadeia decide). */
  translations?: CampaignTranslationRow[];
  /** Número público da campanha, para as URLs /newsletter/:n?lang=xx */
  publicNumber?: number | string | null;
  /** Token do subscritor — permite guardar a preferência de idioma. */
  subscriberToken?: string | null;
  /** Desativa o seletor (ex.: pré-visualização isolada). */
  hideLanguageSwitcher?: boolean;
}

function esc(s: unknown): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const MAX_GALLERY = 6;

function fmtPrice(p: AnyRecord, locale: string): string | null {
  const price = p.price as number | null | undefined;
  if (price == null) return null;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: (p.currency as string) ?? "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} €`;
  }
}

/** Mesma rota pública que a SPA usa: /vehicle/:id */
export function productUrl(p: AnyRecord): string {
  return p?.id ? `${SITE_URL}/vehicle/${p.id}` : SITE_URL;
}

const CONDITION_KEY: Record<string, StringKey> = {
  new: "condition.new",
  novo: "condition.new",
  used: "condition.used",
  usado: "condition.used",
  refurbished: "condition.refurbished",
  recondicionado: "condition.refurbished",
};

const STOCK_KEY: Record<string, StringKey> = {
  available: "stock.available",
  disponivel: "stock.available",
  reserved: "stock.reserved",
  reservado: "stock.reserved",
  sold: "stock.sold",
  vendido: "stock.sold",
};

/** Tradução de termos livres (categorias, rótulos, valores textuais). */
function term(ctx: Ctx, text: unknown): string {
  return translateTerm(ctx.i18n, ctx.lang, text);
}

interface Ctx {
  i18n: NewsletterI18n;
  lang: string;
  locale: string;
}

/** Todos os atributos disponíveis, incluindo especificações dinâmicas. */
function collectSpecs(p: AnyRecord, ctx: Ctx): Array<[string, string]> {
  const t = (k: StringKey) => ctx.i18n.t(ctx.lang, k);
  const brand = p.brand as AnyRecord | undefined;
  const category = p.category as AnyRecord | undefined;
  const subcategory = p.subcategory as AnyRecord | undefined;
  const location = [p.location_city, p.location_country].filter(Boolean).join(", ");
  const condRaw = (p.condition as string) ?? "";
  const stockRaw = (p.stock_status as string) ?? "";
  const specs: Array<[string, string]> = [];
  if (brand?.name) specs.push([t("spec.brand"), String(brand.name)]);
  if (p.model) specs.push([t("spec.model"), String(p.model)]);
  if (category?.name) specs.push([t("spec.category"), term(ctx, category.name)]);
  if (subcategory?.name) specs.push([t("spec.subcategory"), term(ctx, subcategory.name)]);
  if (p.year) specs.push([t("spec.year"), String(p.year)]);
  if (condRaw) {
    const key = CONDITION_KEY[condRaw.toLowerCase()];
    specs.push([t("spec.condition"), key ? t(key) : condRaw]);
  }
  if (stockRaw) {
    const key = STOCK_KEY[stockRaw.toLowerCase()];
    specs.push([t("spec.availability"), key ? t(key) : stockRaw]);
  }
  if (location) specs.push([t("spec.location"), term(ctx, location)]);
  // Especificações dinâmicas: rótulo sempre traduzível; valor apenas quando
  // for texto puro (valores com dígitos são técnicos e ficam intactos).
  for (const [label, value] of specPairs(p)) {
    specs.push([term(ctx, label), /\d/.test(value) ? value : term(ctx, value)]);
  }
  return specs;
}

/** Cartão de características em duas colunas. */
function specRows(p: AnyRecord, ctx: Ctx): string {
  const specs = collectSpecs(p, ctx);
  if (specs.length === 0) return "";

  // Duas colunas por linha — colapsa bem em mobile por ser tabela simples.
  const cells = specs
    .map(
      ([k, v]) => `
        <td width="50%" style="padding:10px 12px;vertical-align:top;">
          <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${MUTED};">${esc(k)}</div>
          <div style="font-size:15px;font-weight:600;color:${INK};margin-top:2px;">${esc(v)}</div>
        </td>`,
    );
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 2) {
    const pair = cells.slice(i, i + 2);
    if (pair.length === 1) pair.push('<td width="50%">&nbsp;</td>');
    rows.push(`<tr>${pair.join("")}</tr>`);
  }

  return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;background:#f8fafc;border:1px solid ${LINE};border-radius:12px;">
        <tr><td colspan="2" style="padding:14px 12px 2px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${BRAND_DARK};font-weight:700;">${esc(ctx.i18n.t(ctx.lang, "product.specs_title"))}</td></tr>
        ${rows.join("")}
      </table>`;
}

/** Galeria com as restantes imagens (grelha 3 colunas). */
function galleryRows(images: string[], title: string, link: string, ctx: Ctx): string {
  const rest = images.slice(1, MAX_GALLERY + 1);
  if (rest.length === 0) return "";
  const cells = rest.map(
    (url) => `
        <td width="33.33%" style="padding:4px;">
          <a href="${esc(link)}" style="display:block;">
            <img src="${esc(url)}" alt="${esc(title)}" width="176" style="display:block;width:100%;height:auto;border-radius:8px;border:1px solid ${LINE};"/>
          </a>
        </td>`,
  );
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 3) {
    const group = cells.slice(i, i + 3);
    while (group.length < 3) group.push('<td width="33.33%">&nbsp;</td>');
    rows.push(`<tr>${group.join("")}</tr>`);
  }
  const extra = images.length - 1 - rest.length;
  const more = extra > 0
    ? ctx.i18n.t(ctx.lang, extra === 1 ? "product.gallery_more_one" : "product.gallery_more_many", { count: extra })
    : "";
  return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
        ${rows.join("")}
      </table>
      ${more ? `<p style="margin:-8px 0 18px;font-size:13px;color:${MUTED};text-align:center;">${esc(more)}</p>` : ""}`;
}

function renderProductCard(
  p: AnyRecord,
  ctx: Ctx,
  defaultCta: string,
  ov?: { title?: string; description?: string; cta?: string },
): string {
  const content = resolveProductContent(p, ctx.lang, ctx.i18n);
  const title = ov?.title || content.title || (p.title as string) || "LEGA";
  const images = orderedImageUrls(p);
  const image = images[0] ?? null;
  const price = fmtPrice(p, ctx.locale);
  const desc = ov?.description || content.description || ((p.description as string) ?? "");
  const cleanDesc = desc.replace(/\s+/g, " ").trim();
  const shortDesc = cleanDesc.slice(0, 600);
  const cta = ov?.cta || defaultCta;
  const link = productUrl(p);
  const brandName = (p.brand as AnyRecord | undefined)?.name as string | undefined;
  const catNameRaw = (p.subcategory as AnyRecord | undefined)?.name
    ?? (p.category as AnyRecord | undefined)?.name;
  const catName = catNameRaw ? term(ctx, catNameRaw) : undefined;

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">
    ${
      image
        ? `<tr><td style="padding:0;"><a href="${esc(link)}" style="display:block;"><img src="${esc(image)}" alt="${esc(title)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;"/></a></td></tr>`
        : ""
    }
    <tr><td style="padding:26px 24px 28px;">
      ${
        brandName || catName
          ? `<div style="margin:0 0 10px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${BRAND_DARK};font-weight:700;">${esc([brandName, catName].filter(Boolean).join(" · "))}</div>`
          : ""
      }
      <h2 style="margin:0 0 14px;font-size:26px;line-height:1.22;font-weight:800;color:${INK};letter-spacing:-.01em;">
        <a href="${esc(link)}" style="color:${INK};text-decoration:none;">${esc(title)}</a>
      </h2>

      <!-- Preço em destaque -->
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
        <tr><td style="background:${price ? "#fff7ed" : "#f1f5f9"};border:1px solid ${price ? "#fed7aa" : LINE};border-radius:10px;padding:10px 16px;">
          <span style="font-size:${price ? "24px" : "17px"};font-weight:800;color:${price ? BRAND_DARK : MUTED};line-height:1;">${price ? esc(price) : esc(ctx.i18n.t(ctx.lang, "product.price_on_request"))}</span>
        </td></tr>
      </table>

      ${specRows(p, ctx)}

      ${galleryRows(images, title, link, ctx)}

      ${
        shortDesc
          ? `<p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:${BODY};">${esc(shortDesc)}${cleanDesc.length > 600 ? "…" : ""}</p>`
          : ""
      }

      <!-- CTA -->
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
        <tr><td align="center" style="border-radius:10px;background:${BRAND};">
          <a href="${esc(link)}" style="display:block;padding:16px 24px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">${esc(cta)} &rarr;</a>
        </td></tr>
      </table>
      <p style="margin:12px 0 0;text-align:center;font-size:13px;color:${MUTED};">
        ${esc(ctx.i18n.t(ctx.lang, "product.contact_prefix"))} <a href="${WHATSAPP_URL}" style="color:${BRAND_DARK};text-decoration:none;font-weight:600;">WhatsApp ${esc(PHONE_DISPLAY)}</a>
      </p>
    </td></tr>
  </table>`;
}

function socialLinks(): string {
  const items: Array<[string, string]> = [
    ["Website", SITE_URL],
    ["Facebook", FACEBOOK_URL],
    ["Instagram", INSTAGRAM_URL],
  ];
  if (LINKEDIN_URL) items.push(["LinkedIn", LINKEDIN_URL]);
  return items
    .map(
      ([label, href]) =>
        `<a href="${esc(href)}" style="color:#ffffff;text-decoration:none;font-weight:600;margin:0 10px;">${esc(label)}</a>`,
    )
    .join('<span style="color:rgba(255,255,255,.5);">·</span>');
}

/** Barra discreta de seleção de idioma (linka para as versões web). */
function languageSwitcher(opts: RenderOptions, ctx: Ctx): string {
  if (opts.hideLanguageSwitcher) return "";
  const langs = ctx.i18n.languages;
  if (langs.length < 2 || opts.publicNumber == null) return "";

  const items = langs
    .map((l) => {
      const active = l.code === ctx.lang;
      const href = newsletterViewUrl(opts.publicNumber, l.code, opts.subscriberToken);
      const label = `${l.flag_emoji ? l.flag_emoji + " " : ""}${l.native_label}`;
      return active
        ? `<span style="color:${BRAND_DARK};font-weight:700;">${esc(label)}</span>`
        : `<a href="${esc(href)}" style="color:${MUTED};text-decoration:none;">${esc(label)}</a>`;
    })
    .join(`<span style="color:${LINE};margin:0 6px;">·</span>`);

  return `
          <tr><td style="padding:10px 24px;background:#ffffff;border:1px solid ${LINE};border-bottom:0;border-radius:14px 14px 0 0;text-align:center;font-size:12px;color:${MUTED};">
            <span style="letter-spacing:.08em;text-transform:uppercase;font-size:10px;margin-right:8px;">${esc(ctx.i18n.t(ctx.lang, "lang.label"))}</span>
            ${items}
          </td></tr>`;
}

export function renderNewsletterHtml(opts: RenderOptions): string {
  const { campaign, products, i18n } = opts;
  const lang = i18n.resolve(opts.lang);
  const ctx: Ctx = { i18n, lang, locale: i18n.language(lang)?.locale ?? "en-GB" };
  const t = (k: StringKey, vars?: Record<string, string | number>) => i18n.t(lang, k, vars);

  const tpl = opts.template ?? {};
  const content = resolveCampaignContent(
    campaign as Record<string, any>,
    lang,
    i18n,
    opts.translations ?? [],
    tpl,
  );
  const intro = content.intro;
  const outro = content.outro;
  const tagline = (tpl.header ?? "").trim() || t("tagline");
  const footerText = content.footerNote.trim();
  const overrides = campaign.content_json?.overrides ?? {};
  const unsub = opts.unsubscribeUrl ?? "{{{RESEND_UNSUBSCRIBE_URL}}}";
  const hasSwitcher = !opts.hideLanguageSwitcher
    && i18n.languages.length > 1
    && opts.publicNumber != null;

  const cards = products
    .map((p) => renderProductCard(p, ctx, content.ctaLabel, overrides[p.id as string]))
    .join("\n");

  return `<!doctype html>
<html lang="${esc(ctx.locale)}">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <meta name="x-apple-disable-message-reformatting"/>
    <meta name="color-scheme" content="light only"/>
    <meta name="supported-color-schemes" content="light only"/>
    <title>${esc(content.subject)}</title>
    <style>
      body { margin:0; padding:0; width:100% !important; }
      img { -ms-interpolation-mode:bicubic; }
      a { text-decoration:none; }
      @media only screen and (max-width:620px) {
        .lg-wrap { padding:12px 8px !important; }
        .lg-pad { padding-left:16px !important; padding-right:16px !important; }
        .lg-h1 { font-size:22px !important; }
        .lg-hero { font-size:24px !important; }
      }
    </style>
    <!--[if mso]><style>body,table,td,a{font-family:Arial,Helvetica,sans-serif !important;}</style><![endif]-->
  </head>
  <body style="margin:0;padding:0;background:${CANVAS};font-family:${FONT};color:${INK};">
    ${content.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(content.preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${CANVAS};">
      <tr><td align="center" class="lg-wrap" style="padding:24px 12px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
${languageSwitcher(opts, ctx)}
          <!-- Header: logótipo oficial LEGA -->
          <tr><td style="padding:26px 24px 18px;text-align:center;background:#ffffff;border-radius:${hasSwitcher ? "0" : "14px 14px 0 0"};border:1px solid ${LINE};border-bottom:0;${hasSwitcher ? "border-top:0;" : ""}">
            <a href="${esc(SITE_URL)}" style="display:inline-block;">
              <img src="${esc(LOGO_URL)}" alt="LEGA" width="150" style="display:block;margin:0 auto;width:150px;max-width:60%;height:auto;border:0;"/>
            </a>
            <div style="margin-top:10px;color:${MUTED};font-size:11px;letter-spacing:.16em;text-transform:uppercase;">${esc(tagline)}</div>
          </td></tr>
          <tr><td style="height:4px;line-height:0;font-size:0;background:${BRAND};">&nbsp;</td></tr>

          <!-- Intro -->
          <tr><td class="lg-pad" style="padding:26px 24px 4px;background:#ffffff;border-left:1px solid ${LINE};border-right:1px solid ${LINE};">
            <h1 class="lg-hero" style="margin:0 0 ${intro ? "12px" : "4px"};font-size:27px;line-height:1.25;font-weight:800;color:${INK};letter-spacing:-.02em;">${esc(content.title)}</h1>
            ${intro ? `<p style="margin:0;font-size:16px;line-height:1.65;color:${BODY};white-space:pre-line;">${esc(intro)}</p>` : ""}
          </td></tr>

          <!-- Produtos -->
          <tr><td class="lg-pad" style="padding:24px 24px 4px;background:#ffffff;border-left:1px solid ${LINE};border-right:1px solid ${LINE};">
            ${cards || `<p style="margin:0 0 20px;color:${MUTED};font-size:15px;">${esc(t("products.empty"))}</p>`}
          </td></tr>

          <!-- Outro -->
          ${
            outro
              ? `<tr><td class="lg-pad" style="padding:4px 24px 8px;background:#ffffff;border-left:1px solid ${LINE};border-right:1px solid ${LINE};">
            <p style="margin:0;font-size:15px;line-height:1.65;color:${BODY};white-space:pre-line;">${esc(outro)}</p>
          </td></tr>`
              : ""
          }

          <!-- CTA global -->
          <tr><td class="lg-pad" style="padding:22px 24px 30px;background:#ffffff;border-left:1px solid ${LINE};border-right:1px solid ${LINE};border-bottom:1px solid ${LINE};text-align:center;">
            <a href="${esc(SITE_URL)}" style="display:inline-block;padding:13px 26px;border:2px solid ${BRAND};border-radius:10px;color:${BRAND_DARK};font-weight:700;font-size:15px;">${esc(t("cta.global"))}</a>
          </td></tr>

          <!-- Footer -->
          <tr><td class="lg-pad" style="padding:28px 24px;background:${BRAND};color:#ffffff;border-radius:0 0 14px 14px;font-size:13px;line-height:1.7;text-align:center;">
            ${footerText ? `<p style="margin:0 0 14px;color:#ffffff;white-space:pre-line;opacity:.95;">${esc(footerText)}</p>` : ""}
            <p style="margin:0 0 8px;color:#ffffff;font-weight:700;font-size:15px;">${esc(t("footer.company"))}</p>
            <p style="margin:0 0 4px;">
              <a href="tel:${PHONE_TEL}" style="color:#ffffff;">${esc(PHONE_DISPLAY)}</a>
              <span style="opacity:.6;">·</span>
              <a href="mailto:${EMAIL}" style="color:#ffffff;">${esc(EMAIL)}</a>
            </p>
            <p style="margin:0 0 14px;color:rgba(255,255,255,.9);font-size:12px;">${esc(ADDRESS)}</p>
            <p style="margin:0 0 16px;">${socialLinks()}</p>
            <p style="margin:0;color:rgba(255,255,255,.85);font-size:11px;line-height:1.6;">
              ${esc(t("footer.reason"))}<br/>
              <a href="${esc(unsub)}" style="color:#ffffff;text-decoration:underline;">${esc(t("footer.unsubscribe"))}</a>
              ${
                opts.publicNumber != null
                  ? `<span style="opacity:.6;"> · </span><a href="${esc(newsletterViewUrl(opts.publicNumber, lang, opts.subscriberToken))}" style="color:#ffffff;text-decoration:underline;">${esc(t("view.online"))}</a>`
                  : ""
              }
            </p>
          </td></tr>

          <tr><td style="padding:16px 8px;text-align:center;color:${MUTED};font-size:11px;">${esc(t("footer.rights", { year: new Date().getFullYear() }))}</td></tr>

        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function buildDefaultSubject(
  products: AnyRecord[],
  i18n?: NewsletterI18n,
  lang?: string,
): string {
  if (!i18n) {
    const t = (products[0]?.title as string) || "LEGA";
    return products.length === 1 ? `Novidade LEGA: ${t}` : `Novidades LEGA: ${products.length}`;
  }
  const code = i18n.resolve(lang);
  if (products.length === 1) {
    const title = resolveProductContent(products[0] ?? {}, code, i18n).title
      || (products[0]?.title as string) || "LEGA";
    return i18n.t(code, "subject.single", { title });
  }
  return i18n.t(code, "subject.multi", { count: products.length });
}
