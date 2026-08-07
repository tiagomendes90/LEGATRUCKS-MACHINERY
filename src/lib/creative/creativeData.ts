import { getGalleryImageUrls } from "@/utils/productImages";
import type { CreativeData } from "./types";

export const SITE_URL: string =
  ((import.meta as any)?.env?.VITE_PUBLIC_SITE_URL as string) ||
  "https://www.lega.pt";

export const PRODUCT_CREATIVE_SELECT = `
  id, title, model, description, price, currency, year, condition,
  stock_status, location_city, location_country, is_active, social_status,
  brand:brands(name, slug),
  category:categories(name, slug),
  subcategory:subcategories(name, slug),
  images:product_images(image_url, is_primary, sort_order),
  specs:spec_values(
    value_number, value_text, value_boolean,
    definition:spec_definitions(name, label, unit, data_type)
  )
`;

const CONDITION_LABELS: Record<string, string> = {
  new: "Novo",
  used: "Usado",
  restored: "Restaurado",
};

const HOURS_KEYS = ["hour", "hora", "horas", "working_hours"];
const KM_KEYS = ["km", "quilometr", "kilometr", "mileage", "odometer"];

const num = (v: unknown) =>
  v === null || v === undefined || v === "" ? null : Number(v);

export function formatPrice(
  price?: number | null,
  currency?: string | null,
): string | null {
  const p = num(price);
  if (p === null || Number.isNaN(p) || p <= 0) return null;
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(p);
}

function specValue(spec: any): string | null {
  const def = spec?.definition ?? {};
  if (spec?.value_number !== null && spec?.value_number !== undefined) {
    const n = Number(spec.value_number);
    if (Number.isNaN(n)) return null;
    return `${n.toLocaleString("pt-PT")}${def.unit ? ` ${def.unit}` : ""}`;
  }
  if (spec?.value_text) return String(spec.value_text);
  if (spec?.value_boolean !== null && spec?.value_boolean !== undefined)
    return spec.value_boolean ? "Sim" : "Não";
  return null;
}

/** Normaliza um produto da base de dados nos dados usados pelos criativos. */
export function buildCreativeData(product: any): CreativeData {
  const brand: string = product?.brand?.name ?? "";
  const title: string = product?.title ?? "";
  const model: string =
    product?.model?.trim() ||
    (brand ? title.replace(new RegExp(`^${brand}\\s*`, "i"), "").trim() : title) ||
    title;

  const specs = ((product?.specs as any[]) ?? [])
    .map((s) => {
      const value = specValue(s);
      if (!value) return null;
      return {
        label: String(s?.definition?.label ?? s?.definition?.name ?? ""),
        name: String(s?.definition?.name ?? "").toLowerCase(),
        unit: String(s?.definition?.unit ?? "").toLowerCase(),
        value,
      };
    })
    .filter(Boolean) as Array<{
    label: string;
    name: string;
    unit: string;
    value: string;
  }>;

  const matches = (keys: string[]) =>
    specs.find((s) =>
      keys.some(
        (k) =>
          s.name.includes(k) ||
          s.label.toLowerCase().includes(k) ||
          s.unit.includes(k),
      ),
    );

  const hours = matches(HOURS_KEYS);
  const km = matches(KM_KEYS);
  const usage = hours?.value ?? km?.value ?? null;

  const location =
    [product?.location_city, product?.location_country]
      .map((v) => (v ? String(v).trim() : ""))
      .filter(Boolean)
      .join(", ") || null;

  return {
    productId: String(product?.id ?? ""),
    brand,
    model,
    title,
    price: formatPrice(product?.price, product?.currency),
    year: product?.year ? String(product.year) : null,
    usage,
    location,
    condition: CONDITION_LABELS[String(product?.condition ?? "").toLowerCase()] ?? null,
    category: product?.subcategory?.name ?? product?.category?.name ?? null,
    description: product?.description ?? null,
    url: `${SITE_URL.replace(/\/$/, "")}/vehicle/${product?.id}`,
    website: SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    images: getGalleryImageUrls(product?.images ?? []),
    specs: specs.slice(0, 6).map((s) => ({ label: s.label, value: s.value })),
  };
}
