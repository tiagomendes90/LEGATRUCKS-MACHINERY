// URLs públicas das versões por idioma de uma newsletter.

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://www.lega.pt";

export function newsletterViewUrl(
  publicNumber: number | string | null | undefined,
  lang: string,
  token?: string | null,
): string {
  if (publicNumber == null) return SITE_URL;
  const qs = new URLSearchParams({ lang });
  if (token) qs.set("t", token);
  return `${SITE_URL}/newsletter/${publicNumber}?${qs.toString()}`;
}

export function siteUrl(): string {
  return SITE_URL;
}