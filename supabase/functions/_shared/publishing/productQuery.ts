// Fonte única de verdade para os dados de produto usados por TODOS os canais
// de publicação (Facebook, Instagram, Newsletter, preview do Admin).
// Garante que o conteúdo base é sempre o mesmo: imagens, descrição, link.

export const PRODUCT_SELECT = `
  id, title, model, description, price, currency, year, condition,
  stock_status, location_city, location_country, is_active, social_caption,
  brand:brands(name, slug),
  category:categories(id, name, slug),
  subcategory:subcategories(id, name, slug),
  images:product_images(image_url, is_primary, sort_order),
  translations:product_translations(language_code, title, description),
  specs:spec_values(
    value_number, value_text, value_boolean,
    definition:spec_definitions(name, label, unit, data_type)
  )
`;

export type ProductRecord = Record<string, unknown>;

/** Um produto completo (ou null). */
export async function loadProduct(
  supabase: any,
  productId: string | null | undefined,
): Promise<ProductRecord | null> {
  if (!productId) return null;
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .maybeSingle();
  return (data as ProductRecord) ?? null;
}

/** Vários produtos, preservando a ordem dos ids pedidos. */
export async function loadProductsByIds(
  supabase: any,
  productIds: string[],
): Promise<ProductRecord[]> {
  if (!productIds || productIds.length === 0) return [];
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", productIds);
  const byId = new Map(((data ?? []) as any[]).map((p) => [p.id, p]));
  return productIds.map((id) => byId.get(id)).filter(Boolean) as ProductRecord[];
}

/** Todas as imagens do produto ordenadas (primária primeiro, depois sort_order). */
export function orderedImageUrls(product: ProductRecord | null): string[] {
  const imgs = ((product?.images as any[]) ?? []).filter(Boolean);
  return [...imgs]
    .sort((a, b) => {
      if (!!b?.is_primary !== !!a?.is_primary) return b?.is_primary ? 1 : -1;
      return (a?.sort_order ?? 0) - (b?.sort_order ?? 0);
    })
    .map((i) => i?.image_url as string)
    .filter(Boolean);
}

/** Especificações técnicas dinâmicas normalizadas em pares label/valor. */
export function specPairs(product: ProductRecord | null): Array<[string, string]> {
  const rows = ((product?.specs as any[]) ?? []).filter(Boolean);
  const out: Array<[string, string]> = [];
  for (const r of rows) {
    const def = r.definition;
    if (!def) continue;
    let value: string | null = null;
    if (r.value_number != null) value = String(r.value_number);
    else if (r.value_text != null && String(r.value_text).trim() !== "") value = String(r.value_text);
    else if (r.value_boolean != null) value = r.value_boolean ? "Sim" : "Não";
    if (!value) continue;
    if (def.unit && r.value_number != null) value = `${value} ${def.unit}`;
    out.push([String(def.label ?? def.name), value]);
  }
  return out.sort((a, b) => a[0].localeCompare(b[0], "pt"));
}