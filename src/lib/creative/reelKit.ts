import type { CreativeData } from "./types";
import { slugify } from "./render";

export interface ReelKit {
  title: string;
  description: string;
  hashtags: string[];
  cta: string;
}

const BASE_TAGS = [
  "LEGA",
  "maquinaria",
  "camioes",
  "equipamentoprofissional",
  "obraspublicas",
  "maquinasusadas",
  "portugal",
];

const tag = (value?: string | null) => {
  if (!value) return null;
  const s = slugify(value).replace(/-/g, "");
  return s.length > 2 ? s : null;
};

/** Gera o kit textual do Reel a partir exclusivamente dos dados do produto. */
export function buildReelKit(data: CreativeData): ReelKit {
  const headline = [data.brand, data.model].filter(Boolean).join(" ").trim();
  const titleBits = [headline || data.title];
  if (data.year) titleBits.push(data.year);
  const title = titleBits.join(" · ");

  const lines: string[] = [];
  lines.push(`${headline || data.title}${data.year ? ` (${data.year})` : ""}`);

  const facts = [
    data.usage ? `Utilização: ${data.usage}` : null,
    data.condition ? `Estado: ${data.condition}` : null,
    data.location ? `Localização: ${data.location}` : null,
    data.price ? `Preço: ${data.price}` : "Preço sob consulta",
  ].filter(Boolean) as string[];
  if (facts.length) lines.push("", ...facts.map((f) => `• ${f}`));

  const extraSpecs = data.specs.slice(0, 4);
  if (extraSpecs.length) {
    lines.push("", "Especificações:");
    lines.push(...extraSpecs.map((s) => `• ${s.label}: ${s.value}`));
  }

  if (data.description) {
    const clean = data.description.replace(/\s+/g, " ").trim();
    lines.push("", clean.length > 320 ? `${clean.slice(0, 317)}…` : clean);
  }

  lines.push("", "📍 Disponível na LEGA · Exportação para toda a Europa");
  lines.push(`🔗 ${data.url}`);

  const hashtags = Array.from(
    new Set(
      [
        tag(data.brand),
        tag(data.model),
        tag(data.category),
        tag(data.location?.split(",")[0]),
        ...BASE_TAGS.map((t) => tag(t)),
      ].filter(Boolean) as string[],
    ),
  ).slice(0, 12);

  return {
    title,
    description: lines.join("\n"),
    hashtags,
    cta: `Saiba mais em ${data.website}`,
  };
}
