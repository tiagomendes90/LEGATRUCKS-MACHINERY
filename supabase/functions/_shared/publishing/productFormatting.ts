// Shared formatting helpers used by publishing channel adapters.
// Keep pure and dependency-free so adapters stay tiny.

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://lega.pt";

type AnyRecord = Record<string, unknown>;

export function getPrimaryImageUrl(product: AnyRecord | null): string | null {
  if (!product) return null;
  const images = product.images as Array<AnyRecord> | undefined;
  if (!Array.isArray(images) || images.length === 0) return null;
  const primary =
    images.find((i) => i?.is_primary) ??
    [...images].sort(
      (a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0),
    )[0];
  return (primary?.image_url as string) ?? null;
}

export function getProductUrl(product: AnyRecord | null): string {
  if (!product?.id) return SITE_URL;
  return `${SITE_URL}/veiculo/${product.id}`;
}

function formatPrice(product: AnyRecord | null): string | null {
  const price = product?.price as number | null | undefined;
  if (price == null) return null;
  try {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: (product?.currency as string) ?? "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} €`;
  }
}

export function buildProductCaption(
  product: AnyRecord | null,
  link: string,
  opts: { includeLinkInCaption?: boolean } = {},
): string {
  if (!product) return link;
  const title = (product.title as string) ?? "Nova viatura disponível";
  const brand = (product as any)?.brand?.name as string | undefined;
  const year = product.year as number | undefined;
  const price = formatPrice(product);

  const parts: string[] = [];
  parts.push(`🚚 ${title}`);
  const metaBits = [brand, year ? `${year}` : null, price].filter(Boolean);
  if (metaBits.length) parts.push(metaBits.join(" · "));

  const desc = product.description as string | undefined;
  if (desc) {
    const trimmed = desc.replace(/\s+/g, " ").trim();
    parts.push(trimmed.length > 400 ? `${trimmed.slice(0, 397)}…` : trimmed);
  }

  parts.push("");
  parts.push(opts.includeLinkInCaption ? `Ver detalhes: ${link}` : link);
  parts.push("#LEGA #camioes #maquinaria");
  return parts.join("\n");
}

export function buildProductEmailSubject(product: AnyRecord | null): string {
  const title = (product?.title as string) ?? "Nova viatura na LEGA";
  return `Novidade LEGA: ${title}`;
}

export function buildProductEmailHtml(product: AnyRecord | null, link: string): string {
  const title = (product?.title as string) ?? "Nova viatura disponível";
  const image = getPrimaryImageUrl(product);
  const brand = (product as any)?.brand?.name as string | undefined;
  const year = product?.year as number | undefined;
  const price = formatPrice(product);
  const desc = ((product?.description as string) ?? "").replace(/\s+/g, " ").trim();
  const shortDesc = desc.length > 320 ? `${desc.slice(0, 317)}…` : desc;
  const metaBits = [brand, year ? `${year}` : null, price].filter(Boolean).join(" · ");

  return `<!doctype html>
<html lang="pt">
  <body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f7;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
          <tr><td style="padding:24px;text-align:center;background:#f97316;color:#fff;font-weight:700;font-size:18px;letter-spacing:2px;">LEGA</td></tr>
          ${
            image
              ? `<tr><td><img src="${image}" alt="${escapeHtml(title)}" width="600" style="display:block;width:100%;height:auto;"/></td></tr>`
              : ""
          }
          <tr><td style="padding:24px;">
            <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;">${escapeHtml(title)}</h1>
            ${metaBits ? `<p style="margin:0 0 16px;color:#555;font-size:14px;">${escapeHtml(metaBits)}</p>` : ""}
            ${shortDesc ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#333;">${escapeHtml(shortDesc)}</p>` : ""}
            <p style="margin:0 0 24px;text-align:center;">
              <a href="${link}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">Ver viatura</a>
            </p>
            <p style="margin:0;font-size:12px;color:#888;text-align:center;">Recebe este email porque subscreveu a newsletter LEGA. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#888;">Cancelar subscrição</a>.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}