export type CreativeKind = "story" | "reel_cover";

export type CreativeBlockKey =
  | "logo"
  | "brand"
  | "model"
  | "price"
  | "year"
  | "usage"
  | "location"
  | "qr"
  | "website"
  | "cta";

export type CreativeLayout = "editorial" | "diagonal" | "minimal" | "promo";

export interface TemplateConfig {
  layout: CreativeLayout;
  background: string;
  surface: string;
  accent: string;
  text: string;
  muted: string;
  overlay: number;
  photoFrame?: "full" | "top" | "card";
  accentBar?: boolean;
  ribbon?: string;
  cta?: string;
  website?: string;
  blocks: Partial<Record<CreativeBlockKey, boolean>>;
}

export interface CreativeTemplate {
  id: string;
  name: string;
  kind: CreativeKind;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  config: TemplateConfig;
  created_at?: string;
  updated_at?: string;
}

/** Dados normalizados do produto usados por todos os criativos. */
export interface CreativeData {
  productId: string;
  brand: string;
  model: string;
  title: string;
  price: string | null;
  year: string | null;
  usage: string | null;
  location: string | null;
  condition: string | null;
  category: string | null;
  description: string | null;
  url: string;
  website: string;
  images: string[];
  specs: Array<{ label: string; value: string }>;
}

export const DEFAULT_CONFIG: TemplateConfig = {
  layout: "editorial",
  background: "#081B33",
  surface: "#0B2545",
  accent: "#F39200",
  text: "#FFFFFF",
  muted: "#C7D3E3",
  overlay: 0.55,
  photoFrame: "full",
  accentBar: true,
  cta: "Disponível agora",
  website: "www.lega.pt",
  blocks: {
    logo: true,
    brand: true,
    model: true,
    price: true,
    year: true,
    usage: true,
    location: true,
    qr: true,
    website: true,
    cta: true,
  },
};

export const BLOCK_LABELS: Record<CreativeBlockKey, string> = {
  logo: "Logótipo LEGA",
  brand: "Marca",
  model: "Modelo",
  price: "Preço",
  year: "Ano",
  usage: "Horas / Km",
  location: "Localização",
  qr: "QR Code",
  website: "Website",
  cta: "CTA",
};

export const LAYOUT_LABELS: Record<CreativeLayout, string> = {
  editorial: "Editorial (foto inteira + painel)",
  diagonal: "Split diagonal",
  minimal: "Minimal claro",
  promo: "Promoção com faixa",
};
