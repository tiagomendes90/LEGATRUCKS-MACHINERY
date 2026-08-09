import QRCode from "qrcode";
import type { CreativeData, CreativeKind, TemplateConfig } from "./types";

export const CANVAS_W = 1080;
export const CANVAS_H = 1920;
export const LEGA_LOGO = "/lovable-uploads/9a1d192d-e9d6-4064-944c-c583427ab323.png";

const FONT = '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif';
const M = 84;

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return cached;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${src}`));
    img.src = src;
  });
  imageCache.set(src, p);
  return p;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function contrastOn(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#081B33" : "#FFFFFF";
}

function setFont(
  ctx: CanvasRenderingContext2D,
  weight: number,
  size: number,
  spacing = 0,
) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  try {
    (ctx as any).letterSpacing = `${spacing}px`;
  } catch {
    /* noop */
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const ir = img.width / img.height;
  const tr = w / h;
  let sw = img.width;
  let sh = img.height;
  let sx = 0;
  let sy = 0;
  if (ir > tr) {
    sw = img.height * tr;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / tr;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  let truncated = false;
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) {
        truncated = true;
        break;
      }
    }
  }
  if (!truncated && lines.length < maxLines && current) lines.push(current);
  if (truncated || lines.some((l) => ctx.measureText(l).width > maxWidth)) {
    let last = lines[maxLines - 1];
    if (truncated && !last.endsWith("…")) last = `${last}…`;
    if (ctx.measureText(last).width > maxWidth) {
      while (last.length > 3 && ctx.measureText(`${last}…`).width > maxWidth) {
        last = last.replace(/…$/, "").slice(0, -1);
      }
      last = `${last.replace(/…$/, "").trim()}…`;
    }
    lines[maxLines - 1] = last;
  }
  return lines;
}

function fitHeadline(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  startSize: number,
  minSize: number,
) {
  let size = startSize;
  let lines: string[] = [];
  while (size >= minSize) {
    setFont(ctx, 800, size, -1);
    lines = wrapLines(ctx, text, maxWidth, maxLines);
    const overflow = lines.some((l) => ctx.measureText(l).width > maxWidth);
    if (!overflow) break;
    size -= 4;
  }
  setFont(ctx, 800, size, -1);
  return { size, lines };
}

async function qrDataUrl(url: string) {
  return QRCode.toDataURL(url, {
    margin: 0,
    width: 320,
    errorCorrectionLevel: "M",
    color: { dark: "#081B33", light: "#FFFFFF" },
  });
}

export interface RenderOptions {
  data: CreativeData;
  config: TemplateConfig;
  imageUrl: string;
  kind?: CreativeKind;
  headline?: string;
  /** Marca o criativo como vendido (faixa oblíqua "SOLD / VENDIDO"). */
  sold?: boolean;
  /** Texto da faixa (por defeito "SOLD / VENDIDO"). */
  soldLabel?: string;
}

/** Faixa oblíqua de vendido, desenhada por cima de todo o criativo. */

/** Formatos nativos de cada rede para o post de "vendido". */
export type SoldFormatKey = "instagram" | "facebook" | "story";

export const SOLD_FORMATS: Record<
  SoldFormatKey,
  { width: number; height: number; label: string }
> = {
  instagram: { width: 1080, height: 1350, label: "Instagram (4:5)" },
  facebook: { width: 1200, height: 1200, label: "Facebook (1:1)" },
  story: { width: 1080, height: 1920, label: "Story (9:16)" },
};

/**
 * Coloca a fotografia inteira (sem cortes) no formato pedido, usando uma
 * versão desfocada e ampliada da própria foto como fundo.
 */
function drawFramedPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;

  // Fundo: cover + blur
  const cover = Math.max(width / iw, height / ih);
  ctx.save();
  ctx.filter = "blur(48px) brightness(0.7)";
  ctx.drawImage(
    img,
    (width - iw * cover * 1.1) / 2,
    (height - ih * cover * 1.1) / 2,
    iw * cover * 1.1,
    ih * cover * 1.1,
  );
  ctx.restore();

  // Primeiro plano: contain (imagem completa)
  const contain = Math.min(width / iw, height / ih);
  const dw = iw * contain;
  const dh = ih * contain;
  ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
}

export function drawSoldBanner(
  ctx: CanvasRenderingContext2D,
  label: string,
  width = CANVAS_W,
  height = CANVAS_H,
) {
  const text = (label || "SOLD / VENDIDO").toUpperCase();
  const angle = -Math.atan2(height, width);
  const diag = Math.hypot(width, height);
  // Escala pelo lado mais curto: mantém a faixa proporcional em 1:1, 4:5 e 9:16.
  const scale = Math.min(width, height) / 1080;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(angle);

  const bandH = 290 * scale;
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#F39200";
  ctx.fillRect(-diag / 2, -bandH / 2, diag, bandH);

  let size = 194 * scale;
  setFont(ctx, 800, size, 0);
  while (ctx.measureText(text).width > diag - 160 * scale && size > 24) {
    size -= 8 * scale;
    setFont(ctx, 800, size, 0);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(text, 0, 6 * scale);
  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/**
 * Reproduz uma fotografia do produto no seu formato original com a faixa
 * oblíqua "SOLD / VENDIDO" por cima — usada nas publicações de Facebook/Instagram.
 */
export async function renderSoldImage(
  url: string,
  label = "SOLD / VENDIDO",
  format: SoldFormatKey = "instagram",
): Promise<HTMLCanvasElement> {
  const img = await loadImage(url);
  const preset = SOLD_FORMATS[format] ?? SOLD_FORMATS.instagram;
  const canvas = document.createElement("canvas");
  canvas.width = preset.width;
  canvas.height = preset.height;
  const ctx = canvas.getContext("2d")!;
  drawFramedPhoto(ctx, img, canvas.width, canvas.height);
  drawSoldBanner(ctx, label, canvas.width, canvas.height);
  return canvas;
}

/** Dados mínimos do veículo apresentados no criativo de "vendido". */
export interface SoldInfo {
  brand?: string | null;
  model?: string | null;
  price?: string | null;
  year?: string | null;
  usage?: string | null;
  location?: string | null;
  website?: string | null;
}

/** Blocos de informação que podem ser ligados/desligados no criativo. */
export type SoldBlockKey =
  | "logo"
  | "tag"
  | "brand"
  | "model"
  | "price"
  | "year"
  | "usage"
  | "location"
  | "website";

/** Blocos configuráveis no criativo de vendido (apenas os essenciais). */
export const SOLD_BLOCK_LABELS: Partial<Record<SoldBlockKey, string>> = {
  logo: "Logótipo",
  brand: "Marca",
  model: "Modelo",
  location: "Localização",
  website: "Website",
};

export const DEFAULT_SOLD_BLOCKS: Record<SoldBlockKey, boolean> = {
  logo: true,
  tag: false,
  brand: true,
  model: true,
  price: false,
  year: false,
  usage: false,
  location: true,
  website: true,
};

export type SoldThemeKey = "editorial" | "minimal" | "promo" | "fullbleed";

export interface SoldTheme {
  label: string;
  background: string;
  surface: string;
  accent: string;
  text: string;
  muted: string;
  photo: "card" | "full";
}

export const SOLD_THEMES: Record<SoldThemeKey, SoldTheme> = {
  editorial: {
    label: "Editorial escuro",
    background: "#081B33",
    surface: "#0B2545",
    accent: "#F39200",
    text: "#FFFFFF",
    muted: "#C7D3E3",
    photo: "card",
  },
  minimal: {
    label: "Minimal claro",
    background: "#F4F6F9",
    surface: "#E6EBF2",
    accent: "#0B2545",
    text: "#081B33",
    muted: "#5A6B80",
    photo: "card",
  },
  promo: {
    label: "Promoção laranja",
    background: "#2A1400",
    surface: "#3A1D00",
    accent: "#F39200",
    text: "#FFFFFF",
    muted: "#F1D2AC",
    photo: "card",
  },
  fullbleed: {
    label: "Foto inteira",
    background: "#081B33",
    surface: "#081B33",
    accent: "#F39200",
    text: "#FFFFFF",
    muted: "#D8E2EE",
    photo: "full",
  },
};

export interface SoldCreativeOptions {
  label?: string;
  format?: SoldFormatKey;
  /** Chave de tema legado ou tema derivado de um template da biblioteca. */
  theme?: SoldThemeKey | SoldTheme;
  blocks?: Partial<Record<SoldBlockKey, boolean>>;
}

/** Converte um template da Biblioteca de Templates num tema de "vendido". */
export function soldThemeFromConfig(
  config: TemplateConfig,
  label = "Template",
): SoldTheme {
  return {
    label,
    background: config.background ?? "#081B33",
    surface: config.surface ?? config.background ?? "#0B2545",
    accent: config.accent ?? "#F39200",
    text: config.text ?? "#FFFFFF",
    muted: config.muted ?? "#C7D3E3",
    photo: config.photoFrame === "card" ? "card" : "full",
  };
}

/**
 * Criativo de "vendido": template LEGA com a fotografia do produto enquadrada,
 * bloco de informação do veículo e a faixa oblíqua por cima de tudo.
 */
export async function renderSoldCreative(
  url: string,
  info: SoldInfo,
  options: SoldCreativeOptions = {},
): Promise<HTMLCanvasElement> {
  const label = options.label || "SOLD / VENDIDO";
  const format = options.format ?? "instagram";
  const theme =
    typeof options.theme === "object" && options.theme
      ? options.theme
      : SOLD_THEMES[(options.theme as SoldThemeKey) ?? "editorial"] ??
        SOLD_THEMES.editorial;
  const blocks = { ...DEFAULT_SOLD_BLOCKS, ...(options.blocks ?? {}) };
  const preset = SOLD_FORMATS[format] ?? SOLD_FORMATS.instagram;
  const W = preset.width;
  const H = preset.height;
  // Escala adaptada ao formato: nunca deixa a composição transbordar em 1:1.
  const s = Math.min(W / 1080, H / 1350);
  const tall = H / W >= 1.6; // story
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "alphabetic";

  const BG = theme.background;
  const ACCENT = theme.accent;
  const TEXT = theme.text;
  const MUTED = theme.muted;
  const pad = 56 * s;

  // fundo
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // topo: logótipo + faixa de acento
  const showHeader = blocks.logo || blocks.tag;
  const headerH = showHeader ? (tall ? 128 : 110) * s : 36 * s;
  if (blocks.logo) {
    try {
      const logo = await loadImage(LEGA_LOGO);
      const lh = 56 * s;
      const lw = (logo.naturalWidth / logo.naturalHeight) * lh;
      ctx.drawImage(logo, pad, (headerH - lh) / 2, lw, lh);
    } catch {
      setFont(ctx, 800, 44 * s, 2);
      ctx.fillStyle = TEXT;
      ctx.fillText("LEGA", pad, headerH / 2 + 16 * s);
    }
  }
  if (blocks.tag) {
    setFont(ctx, 700, 26 * s, 4);
    ctx.fillStyle = ACCENT;
    ctx.textAlign = "right";
    ctx.fillText("VENDIDO", W - pad, headerH / 2 + 9 * s);
    ctx.textAlign = "left";
  }

  // bloco de informação (rodapé) — medido antes de desenhar para nunca transbordar
  const brand = blocks.brand ? (info.brand ?? "").trim() : "";
  const model = blocks.model ? (info.model ?? "").trim() : "";
  const priceText = blocks.price && info.price ? info.price : "";
  const chips = [
    blocks.year ? info.year : null,
    blocks.usage ? info.usage : null,
    blocks.location ? info.location : null,
  ].filter(Boolean) as string[];
  const site = blocks.website ? (info.website ?? "www.lega.pt").trim() : "";
  const hasInfo = !!brand || !!model || !!priceText || chips.length > 0 || !!site;

  // Altura máxima do painel consoante o rácio do formato.
  const maxInfoH = H * (tall ? 0.34 : 0.38);
  const maxModelLines = tall ? 2 : H / W > 1.1 ? 2 : 1;

  /** Mede o painel para uma escala `k` e devolve altura + linhas do modelo. */
  const measurePanel = (k: number) => {
    const topPad = 44 * k;
    const bottomPad = (site ? 78 : 44) * k;
    let h = hasInfo ? topPad + bottomPad : 24 * s;
    let modelLines: string[] = [];
    let modelSize = 0;
    if (brand) h += 42 * k;
    if (model) {
      const fitted = fitHeadline(
        ctx,
        model,
        W - pad * 2,
        maxModelLines,
        (tall ? 66 : 56) * k,
        28 * k,
      );
      modelLines = fitted.lines;
      modelSize = fitted.size;
      h += fitted.lines.length * fitted.size * 1.12 + 8 * k;
    }
    if (chips.length) h += 44 * k;
    if (priceText) h += 84 * k;
    return { h, modelLines, modelSize };
  };

  let k = s;
  let panel = measurePanel(k);
  // Reduz a escala do painel até caber na área permitida do formato escolhido.
  while (panel.h > maxInfoH && k > s * 0.55) {
    k = Math.max(s * 0.55, k * 0.92);
    panel = measurePanel(k);
  }
  const infoH = Math.min(panel.h, maxInfoH);
  // Painel de informação no canto superior esquerdo, ligeiramente mais elevado.
  const infoY = Math.max(0, headerH - 24 * s);

  const img = await loadImage(url);
  if (theme.photo === "full") {
    drawCover(ctx, img, 0, 0, W, H);
    // Escurece o topo (onde ficam os dados) e mantém leve vinheta em baixo.
    const g = ctx.createLinearGradient(0, 0, 0, infoY + infoH + 80 * s);
    g.addColorStop(0, rgba(BG, 0.92));
    g.addColorStop(0.72, rgba(BG, 0.8));
    g.addColorStop(1, rgba(BG, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const gt = ctx.createLinearGradient(0, H * 0.78, 0, H);
    gt.addColorStop(0, rgba(BG, 0));
    gt.addColorStop(1, rgba(BG, 0.75));
    ctx.fillStyle = gt;
    ctx.fillRect(0, H * 0.78, W, H * 0.22);
  } else {
    // fotografia enquadrada num cartão
    const photoY = infoY + infoH + 12 * s;
    const photoH = H - photoY - (site ? 96 : 48) * s;
    const photoX = pad;
    const photoW = W - pad * 2;
    ctx.save();
    roundRect(ctx, photoX, photoY, photoW, photoH, 32 * s);
    ctx.clip();
    ctx.fillStyle = theme.surface;
    ctx.fillRect(photoX, photoY, photoW, photoH);
    drawCover(ctx, img, photoX, photoY, photoW, photoH);
    const grad = ctx.createLinearGradient(0, photoY + photoH * 0.55, 0, photoY + photoH);
    grad.addColorStop(0, rgba(BG, 0));
    grad.addColorStop(1, rgba(BG, 0.85));
    ctx.fillStyle = grad;
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.restore();
  }

  // painel de dados
  let y = infoY + 44 * k;
  if (brand) {
    setFont(ctx, 700, 26 * k, 6);
    ctx.fillStyle = ACCENT;
    y += 26 * k;
    ctx.fillText(brand.toUpperCase(), pad, y);
    y += 16 * k;
  }
  if (model && panel.modelLines.length) {
    ctx.fillStyle = TEXT;
    setFont(ctx, 800, panel.modelSize, -1);
    for (const line of panel.modelLines) {
      y += panel.modelSize;
      ctx.fillText(line, pad, y);
      y += panel.modelSize * 0.12;
    }
    y += 8 * k;
  }
  if (chips.length) {
    setFont(ctx, 600, 26 * k, 0);
    ctx.fillStyle = MUTED;
    y += 30 * k;
    ctx.fillText(chips.join("  ·  "), pad, y);
    y += 14 * k;
  }
  if (priceText) {
    const bh = 72 * k;
    setFont(ctx, 800, 46 * k, -1);
    const pw = ctx.measureText(priceText).width;
    roundRect(ctx, pad, y + 8 * k, Math.min(pw + 48 * k, W - pad * 2), bh, 16 * k);
    ctx.fillStyle = ACCENT;
    ctx.fill();
    ctx.fillStyle = contrastOn(ACCENT);
    ctx.fillText(priceText, pad + 24 * k, y + 8 * k + bh * 0.68);
    y += bh + 8 * k;
  }
  if (site) {
    setFont(ctx, 700, 24 * k, 2);
    ctx.fillStyle = MUTED;
    ctx.textAlign = "right";
    ctx.fillText(site.toUpperCase(), W - pad, H - 34 * k);
    ctx.textAlign = "left";
  }
  // Faixa oblíqua sempre por cima de tudo.
  drawSoldBanner(ctx, label, W, H);
  return canvas;
}

export async function renderCreative(
  opts: RenderOptions,
): Promise<HTMLCanvasElement> {
  const { data, config } = opts;
  const blocks = config.blocks ?? {};
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "alphabetic";

  const layout = config.layout ?? "editorial";
  const overlay = Math.min(Math.max(config.overlay ?? 0.5, 0), 0.95);

  // --- base ---
  ctx.fillStyle = config.background;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  let photo: HTMLImageElement | null = null;
  try {
    if (opts.imageUrl) photo = await loadImage(opts.imageUrl);
  } catch {
    photo = null;
  }

  let panelTop = CANVAS_H - 760;

  if (layout === "minimal") {
    panelTop = 1210;
    const cardX = M;
    const cardY = 250;
    const cardW = CANVAS_W - M * 2;
    const cardH = 880;
    ctx.save();
    ctx.shadowColor = rgba("#081B33", 0.25);
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 24;
    roundRect(ctx, cardX, cardY, cardW, cardH, 36);
    ctx.fillStyle = config.surface;
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, cardX, cardY, cardW, cardH, 36);
    ctx.clip();
    if (photo) drawCover(ctx, photo, cardX, cardY, cardW, cardH);
    ctx.restore();
  } else if (layout === "diagonal") {
    panelTop = 1215;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(CANVAS_W, 0);
    ctx.lineTo(CANVAS_W, 1230);
    ctx.lineTo(0, 1100);
    ctx.closePath();
    ctx.clip();
    if (photo) drawCover(ctx, photo, 0, 0, CANVAS_W, 1240);
    const g = ctx.createLinearGradient(0, 0, 0, 1240);
    g.addColorStop(0, rgba(config.background, overlay * 0.9));
    g.addColorStop(0.45, rgba(config.background, overlay * 0.25));
    g.addColorStop(1, rgba(config.background, overlay * 0.85));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_W, 1240);
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(0, 1100);
    ctx.lineTo(CANVAS_W, 1230);
    ctx.lineTo(CANVAS_W, CANVAS_H);
    ctx.lineTo(0, CANVAS_H);
    ctx.closePath();
    ctx.fillStyle = config.surface;
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = config.accent;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 1100);
    ctx.lineTo(CANVAS_W, 1230);
    ctx.stroke();
    ctx.restore();
  } else {
    // editorial / promo — fotografia em fundo inteiro
    if (photo) drawCover(ctx, photo, 0, 0, CANVAS_W, CANVAS_H);
    const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    g.addColorStop(0, rgba(config.background, Math.min(overlay + 0.15, 0.95)));
    g.addColorStop(0.34, rgba(config.background, overlay * 0.18));
    g.addColorStop(0.62, rgba(config.background, overlay * 0.72));
    g.addColorStop(1, rgba(config.background, Math.min(overlay + 0.42, 0.98)));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    panelTop = layout === "promo" ? CANVAS_H - 820 : CANVAS_H - 780;
  }

  // faixa de campanha
  if (layout === "promo" && config.ribbon) {
    ctx.save();
    const label = config.ribbon.toUpperCase();
    setFont(ctx, 800, 36, 6);
    const rw = Math.min(ctx.measureText(label).width + 72, CANVAS_W - 2 * 84 - 340);
    const rh = 76;
    const rx = CANVAS_W - 84 - rw;
    const ry = 108;
    roundRect(ctx, rx, ry, rw, rh, rh / 2);
    ctx.fillStyle = config.accent;
    ctx.fill();
    ctx.fillStyle = contrastOn(config.accent);
    ctx.textAlign = "center";
    ctx.fillText(label, rx + rw / 2, ry + rh / 2 + 13);
    ctx.restore();
    ctx.textAlign = "left";
  }

  // --- logótipo ---
  if (blocks.logo !== false) {
    try {
      const logo = await loadImage(LEGA_LOGO);
      const lw = 300;
      const lh = (logo.height / logo.width) * lw;
      if (layout === "minimal") {
        ctx.drawImage(logo, M, 96, lw, lh);
      } else {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 24;
        ctx.drawImage(logo, M, 96, lw, lh);
        ctx.restore();
      }
    } catch {
      /* logo opcional */
    }
  }

  // --- conteúdo ---
  const contentW = CANVAS_W - M * 2;
  const showQr = blocks.qr !== false;
  // O QR fica no rodapé à direita; o texto pode usar toda a largura útil.
  const textW = contentW;

  const headline = opts.headline || data.model || data.title;
  const showBrand = blocks.brand !== false && Boolean(data.brand);
  const showModel = blocks.model !== false && Boolean(headline);
  const chips: string[] = [];
  if (blocks.year !== false && data.year) chips.push(data.year);
  if (blocks.usage !== false && data.usage) chips.push(data.usage);
  if (blocks.location !== false && data.location) chips.push(data.location);
  if (data.condition && chips.length < 3) chips.push(data.condition);
  const showPrice = blocks.price !== false && Boolean(data.price);

  const head = showModel
    ? fitHeadline(ctx, headline, textW, 2, 96, 56)
    : { size: 0, lines: [] as string[] };

  // altura total do bloco para o ancorar acima do rodapé
  const contentH =
    (showBrand ? 26 : 0) +
    (showModel ? head.lines.length * head.size * 0.98 + 22 : 0) +
    (chips.length ? 74 : 0) +
    (showPrice ? 92 : 0);

  const contentBottom = CANVAS_H - 300;
  let y = Math.max(
    panelTop + 82,
    Math.min(panelTop + 96, contentBottom - contentH),
  );

  if (config.accentBar !== false) {
    ctx.fillStyle = config.accent;
    roundRect(ctx, M, y - 58, 120, 10, 5);
    ctx.fill();
  }

  if (showBrand) {
    setFont(ctx, 700, 40, 8);
    ctx.fillStyle = config.accent;
    ctx.fillText(data.brand.toUpperCase(), M, y);
    y += 26;
  }

  if (showModel) {
    const { size, lines } = head;
    setFont(ctx, 800, size, -1);
    ctx.fillStyle = config.text;
    for (const line of lines) {
      y += size * 0.98;
      ctx.fillText(line, M, y);
    }
    y += 22;
  }

  if (chips.length) {
    y += 40;
    setFont(ctx, 600, 34, 1);
    let x = M;
    const chipH = 66;
    for (const chip of chips) {
      const w = ctx.measureText(chip).width + 56;
      if (x + w > M + textW) break;
      roundRect(ctx, x, y - chipH + 18, w, chipH, chipH / 2);
      ctx.fillStyle = rgba(config.text, 0.12);
      ctx.fill();
      ctx.strokeStyle = rgba(config.text, 0.28);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = config.text;
      ctx.fillText(chip, x + 28, y);
      x += w + 18;
    }
    y += 34;
  }

  if (blocks.price !== false && data.price) {
    y += 74;
    setFont(ctx, 800, 78, -1);
    ctx.fillStyle = config.accent;
    ctx.fillText(data.price, M, y);
    y += 18;
  }

  // --- rodapé: CTA + website + QR ---
  const footerY = CANVAS_H - 132;

  if (showQr) {
    try {
      const qrImg = await loadImage(await qrDataUrl(data.url));
      const size = 216;
      const qx = CANVAS_W - M - size;
      const qy = footerY - size + 24;
      roundRect(ctx, qx - 16, qy - 16, size + 32, size + 32, 24);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.drawImage(qrImg, qx, qy, size, size);
    } catch {
      /* QR opcional */
    }
  }

  if (blocks.cta !== false && config.cta) {
    setFont(ctx, 700, 38, 1);
    const w = ctx.measureText(config.cta).width + 72;
    const h = 88;
    roundRect(ctx, M, footerY - h + 10, w, h, h / 2);
    ctx.fillStyle = config.accent;
    ctx.fill();
    ctx.fillStyle = contrastOn(config.accent);
    ctx.fillText(config.cta, M + 36, footerY - h / 2 + 24);
  }

  if (blocks.website !== false) {
    const site = config.website || data.website;
    setFont(ctx, 600, 34, 4);
    ctx.fillStyle = config.muted;
    ctx.fillText(site.toUpperCase(), M, footerY + 46);
  }

  if (opts.sold) drawSoldBanner(ctx, opts.soldLabel || "SOLD / VENDIDO");

  try {
    (ctx as any).letterSpacing = "0px";
  } catch {
    /* noop */
  }
  return canvas;
}

/** Recorta uma fotografia do produto para 1080×1920, pronta para edição em vídeo. */
export async function renderVerticalFrame(url: string): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#081B33";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const img = await loadImage(url);
  // fundo desfocado para preencher o formato vertical
  ctx.save();
  ctx.filter = "blur(48px) brightness(0.55)";
  drawCover(ctx, img, -60, -60, CANVAS_W + 120, CANVAS_H + 120);
  ctx.restore();
  const ratio = img.width / img.height;
  const w = CANVAS_W;
  const h = w / ratio;
  ctx.drawImage(img, 0, (CANVAS_H - h) / 2, w, h);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar PNG"))),
      "image/png",
      1,
    ),
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function slugify(value: string) {
  return (value || "lega")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
