// Shared HTML renderer for newsletter campaigns. Used both by the
// admin preview endpoint and by the `newsletter` channel adapter.
// Pure string templating — no external deps so it runs in Deno.

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://www.lega.pt";

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

export interface RenderOptions {
  campaign: CampaignInput;
  products: AnyRecord[];
  unsubscribeUrl?: string; // Falls back to Resend placeholder
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

function primaryImage(p: AnyRecord): string | null {
  const images = p.images as AnyRecord[] | undefined;
  if (!Array.isArray(images) || images.length === 0) return null;
  const primary =
    images.find((i) => i?.is_primary) ??
    [...images].sort(
      (a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0),
    )[0];
  return (primary?.image_url as string) ?? null;
}

function fmtPrice(p: AnyRecord): string | null {
  const price = p.price as number | null | undefined;
  if (price == null) return null;
  try {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: (p.currency as string) ?? "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} €`;
  }
}

function productUrl(p: AnyRecord): string {
  return p?.id ? `${SITE_URL}/veiculo/${p.id}` : SITE_URL;
}

function renderProductCard(p: AnyRecord, ov?: { title?: string; description?: string; cta?: string }): string {
  const title = ov?.title || (p.title as string) || "Viatura disponível";
  const image = primaryImage(p);
  const brand = (p as any)?.brand?.name as string | undefined;
  const year = p.year as number | undefined;
  const price = fmtPrice(p);
  const desc = ov?.description || ((p.description as string) ?? "");
  const shortDesc = desc.replace(/\s+/g, " ").trim().slice(0, 260);
  const meta = [brand, year ? String(year) : null, price].filter(Boolean).join(" · ");
  const cta = ov?.cta || "Ver viatura";
  const link = productUrl(p);

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;background:#fff;border:1px solid #eaeaef;border-radius:12px;overflow:hidden;">
    ${image
      ? `<tr><td><a href="${esc(link)}" style="display:block;"><img src="${esc(image)}" alt="${esc(title)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;"/></a></td></tr>`
      : ""}
    <tr><td style="padding:20px 24px;">
      <h2 style="margin:0 0 6px;font-size:20px;line-height:1.3;color:#0f172a;">${esc(title)}</h2>
      ${meta ? `<p style="margin:0 0 12px;color:#64748b;font-size:13px;">${esc(meta)}</p>` : ""}
      ${shortDesc ? `<p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#334155;">${esc(shortDesc)}${desc.length > 260 ? "…" : ""}</p>` : ""}
      <p style="margin:0;">
        <a href="${esc(link)}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">${esc(cta)} →</a>
      </p>
    </td></tr>
  </table>`;
}

export function renderNewsletterHtml(opts: RenderOptions): string {
  const { campaign, products } = opts;
  const intro = campaign.content_json?.intro ?? "";
  const outro = campaign.content_json?.outro ?? "";
  const overrides = campaign.content_json?.overrides ?? {};
  const unsub = opts.unsubscribeUrl ?? "{{{RESEND_UNSUBSCRIBE_URL}}}";

  const cards = products.map((p) => renderProductCard(p, overrides[p.id as string])).join("\n");

  return `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>${esc(campaign.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    ${campaign.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(campaign.preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f7;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr><td style="padding:24px;text-align:center;background:#0f172a;border-radius:12px 12px 0 0;">
            <a href="${esc(SITE_URL)}" style="text-decoration:none;color:#fff;font-weight:800;font-size:22px;letter-spacing:6px;">LEGA</a>
            <div style="margin-top:6px;color:#94a3b8;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Camiões · Máquinas · Equipamento</div>
          </td></tr>

          <!-- Intro -->
          ${intro ? `<tr><td style="padding:24px 24px 8px;background:#fff;">
            <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;white-space:pre-line;">${esc(intro)}</p>
          </td></tr>` : `<tr><td style="height:16px;background:#fff;line-height:0;">&nbsp;</td></tr>`}

          <!-- Product cards -->
          <tr><td style="padding:16px 24px 8px;background:#fff;">
            ${cards}
          </td></tr>

          <!-- Outro -->
          ${outro ? `<tr><td style="padding:8px 24px 24px;background:#fff;">
            <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;white-space:pre-line;">${esc(outro)}</p>
          </td></tr>` : ""}

          <!-- Footer -->
          <tr><td style="padding:24px;background:#0f172a;color:#cbd5e1;border-radius:0 0 12px 12px;font-size:12px;line-height:1.6;text-align:center;">
            <p style="margin:0 0 6px;color:#fff;font-weight:600;">LEGA — Comércio de Veículos e Máquinas</p>
            <p style="margin:0 0 12px;">Portugal · <a href="tel:+351912406089" style="color:#cbd5e1;text-decoration:none;">+351 912 406 089</a> · <a href="mailto:geral@lega.pt" style="color:#cbd5e1;text-decoration:none;">geral@lega.pt</a></p>
            <p style="margin:0 0 12px;">
              <a href="${esc(SITE_URL)}" style="color:#f97316;text-decoration:none;margin:0 8px;">Website</a>·
              <a href="https://www.facebook.com/" style="color:#f97316;text-decoration:none;margin:0 8px;">Facebook</a>·
              <a href="https://www.instagram.com/" style="color:#f97316;text-decoration:none;margin:0 8px;">Instagram</a>
            </p>
            <p style="margin:0;color:#64748b;">Recebe este email porque subscreveu a newsletter LEGA.<br/>
              <a href="${esc(unsub)}" style="color:#94a3b8;text-decoration:underline;">Cancelar subscrição</a>
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function buildDefaultSubject(products: AnyRecord[]): string {
  if (products.length === 1) {
    const t = (products[0]?.title as string) || "Novidade LEGA";
    return `Novidade LEGA: ${t}`;
  }
  return `Novidades LEGA: ${products.length} viaturas em destaque`;
}