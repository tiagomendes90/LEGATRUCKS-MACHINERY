// URLs públicas das versões por idioma de uma newsletter.

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://www.lega.pt";

export function newsletterViewUrl(
  publicNumber: number | string | null | undefined,
  lang: string,
  token?: string | null,
): string {
  if (publicNumber == null) return SITE_URL;
  const qs = new URLSearchParams({ lang });
  let url = `${SITE_URL}/newsletter/${publicNumber}?${qs.toString()}`;
  // O token é acrescentado SEM codificação: é um UUID (seguro em URL) ou o
  // marcador %%LEGA_SUBSCRIBER_TOKEN%% que a fila substitui por destinatário.
  // Codificá-lo (%%→%25%25) impedia essa substituição e o link ficava sem token.
  if (token) {
    if (!/^[A-Za-z0-9%_-]+$/.test(token)) return `${url}&t=${encodeURIComponent(token)}`;
    url += `&t=${token}`;
  }
  return url;
}

export function siteUrl(): string {
  return SITE_URL;
}