// Reusable image validation for publishing channels.
// Currently implements Instagram-compatible rules; extensible for other channels.
//
// Uses a HEAD request for content-type / content-length and a lightweight
// byte probe (first ~64KB) to read intrinsic width/height for JPEG/PNG/WEBP.
// Designed to run inside Deno edge functions.

export interface ImageProbe {
  url: string;
  contentType?: string;
  contentLength?: number;
  width?: number;
  height?: number;
}

export interface ValidationIssue {
  url: string;
  code:
    | "fetch_failed"
    | "unsupported_format"
    | "too_large"
    | "too_small"
    | "too_wide"
    | "bad_aspect_ratio"
    | "aspect_mismatch"
    | "unknown_dimensions";
  message: string;
  probe?: ImageProbe;
}

export interface ValidationResult {
  ok: boolean;
  probes: ImageProbe[];
  issues: ValidationIssue[];
}

export interface InstagramImageRules {
  maxBytes: number;      // 8 MB
  minWidth: number;      // 320
  maxWidth: number;      // 1440
  minAspect: number;     // 4:5  = 0.8
  maxAspect: number;     // 1.91:1
  allowedMime: RegExp;
  requireUniformAspect: boolean;
}

export const INSTAGRAM_RULES: InstagramImageRules = {
  maxBytes: 8 * 1024 * 1024,
  minWidth: 320,
  maxWidth: 1440,
  minAspect: 0.8,
  maxAspect: 1.91,
  allowedMime: /^image\/(jpeg|jpg|png)$/i,
  requireUniformAspect: true,
};

// --- Byte-level dimension probes ---------------------------------------------

function readUint16BE(b: Uint8Array, o: number) {
  return (b[o] << 8) | b[o + 1];
}
function readUint32BE(b: Uint8Array, o: number) {
  return ((b[o] << 24) >>> 0) + ((b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]);
}
function readUint32LE(b: Uint8Array, o: number) {
  return b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | ((b[o + 3] << 24) >>> 0);
}

function probePng(b: Uint8Array): { w: number; h: number } | null {
  // signature 8 bytes, then IHDR chunk: length(4)+type(4)+width(4)+height(4)
  if (b.length < 24) return null;
  if (b[0] !== 0x89 || b[1] !== 0x50 || b[2] !== 0x4e || b[3] !== 0x47) return null;
  return { w: readUint32BE(b, 16), h: readUint32BE(b, 20) };
}

function probeJpeg(b: Uint8Array): { w: number; h: number } | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) return null;
    let marker = b[i + 1];
    i += 2;
    while (marker === 0xff && i < b.length) marker = b[i++];
    // SOFn markers (skip DHT/DAC/DRI etc). SOF0..SOF15 except DHT(C4)/JPG(C8)/DAC(CC)
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      if (i + 7 > b.length) return null;
      const h = readUint16BE(b, i + 3);
      const w = readUint16BE(b, i + 5);
      return { w, h };
    }
    if (i + 2 > b.length) return null;
    const segLen = readUint16BE(b, i);
    i += segLen;
  }
  return null;
}

function probeWebp(b: Uint8Array): { w: number; h: number } | null {
  // RIFF....WEBPVP8 / VP8L / VP8X
  if (b.length < 30) return null;
  if (
    b[0] !== 0x52 || b[1] !== 0x49 || b[2] !== 0x46 || b[3] !== 0x46 ||
    b[8] !== 0x57 || b[9] !== 0x45 || b[10] !== 0x42 || b[11] !== 0x50
  ) return null;
  const type = String.fromCharCode(b[12], b[13], b[14], b[15]);
  if (type === "VP8 ") {
    const w = readUint16BE(b, 27) & 0x3fff;
    const h = readUint16BE(b, 29) & 0x3fff;
    return { w: ((b[26] | (b[27] << 8)) & 0x3fff), h: ((b[28] | (b[29] << 8)) & 0x3fff) };
  }
  if (type === "VP8L") {
    const w = 1 + (((b[22] | (b[23] << 8)) & 0x3fff));
    const h = 1 + ((((b[23] >> 6) | (b[24] << 2) | (b[25] << 10)) & 0x3fff));
    return { w, h };
  }
  if (type === "VP8X") {
    const w = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const h = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    return { w, h };
  }
  return null;
}

function probeDimensions(b: Uint8Array, mime?: string): { w: number; h: number } | null {
  if (mime?.includes("png") || (b[0] === 0x89 && b[1] === 0x50)) return probePng(b);
  if (mime?.includes("jpeg") || (b[0] === 0xff && b[1] === 0xd8)) return probeJpeg(b);
  if (mime?.includes("webp") || (b[0] === 0x52 && b[1] === 0x49)) return probeWebp(b);
  return probePng(b) ?? probeJpeg(b) ?? probeWebp(b);
}

// --- Public API --------------------------------------------------------------

export async function probeImage(url: string, timeoutMs = 8000): Promise<ImageProbe | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    // Fetch first 64KB — enough for JPEG/PNG/WEBP headers.
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-65535" },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok && res.status !== 206) return null;
    const contentType = res.headers.get("content-type") ?? undefined;
    const totalLenHeader =
      res.headers.get("content-range")?.split("/")?.[1] ??
      res.headers.get("content-length") ??
      undefined;
    const contentLength = totalLenHeader ? Number(totalLenHeader) : undefined;
    const buf = new Uint8Array(await res.arrayBuffer());
    const dims = probeDimensions(buf, contentType);
    return {
      url,
      contentType,
      contentLength: Number.isFinite(contentLength) ? contentLength : undefined,
      width: dims?.w,
      height: dims?.h,
    };
  } catch {
    return null;
  }
}

export async function validateInstagramImages(
  urls: string[],
  rules: InstagramImageRules = INSTAGRAM_RULES,
): Promise<ValidationResult> {
  const probes: ImageProbe[] = [];
  const issues: ValidationIssue[] = [];

  for (const url of urls) {
    const p = await probeImage(url);
    if (!p) {
      issues.push({ url, code: "fetch_failed", message: `Não foi possível ler a imagem: ${url}` });
      continue;
    }
    probes.push(p);

    if (p.contentType && !rules.allowedMime.test(p.contentType)) {
      issues.push({
        url, probe: p, code: "unsupported_format",
        message: `Formato ${p.contentType} não suportado pelo Instagram (usar JPEG/PNG).`,
      });
      continue;
    }
    if (p.contentLength && p.contentLength > rules.maxBytes) {
      issues.push({
        url, probe: p, code: "too_large",
        message: `Imagem excede ${Math.round(rules.maxBytes / 1024 / 1024)} MB (${(p.contentLength / 1024 / 1024).toFixed(1)} MB).`,
      });
      continue;
    }
    if (!p.width || !p.height) {
      issues.push({
        url, probe: p, code: "unknown_dimensions",
        message: "Não foi possível determinar as dimensões da imagem.",
      });
      continue;
    }
    if (p.width < rules.minWidth) {
      issues.push({
        url, probe: p, code: "too_small",
        message: `Largura ${p.width}px inferior ao mínimo ${rules.minWidth}px do Instagram.`,
      });
      continue;
    }
    if (p.width > rules.maxWidth) {
      issues.push({
        url, probe: p, code: "too_wide",
        message: `Largura ${p.width}px excede o máximo recomendado ${rules.maxWidth}px do Instagram.`,
      });
      continue;
    }
    const aspect = p.width / p.height;
    if (aspect < rules.minAspect || aspect > rules.maxAspect) {
      issues.push({
        url, probe: p, code: "bad_aspect_ratio",
        message: `Rácio ${aspect.toFixed(2)} fora do intervalo Instagram (${rules.minAspect}–${rules.maxAspect}).`,
      });
    }
  }

  if (rules.requireUniformAspect && probes.length > 1) {
    const ratios = probes
      .filter((p) => p.width && p.height)
      .map((p) => (p.width! / p.height!));
    if (ratios.length > 1) {
      const min = Math.min(...ratios);
      const max = Math.max(...ratios);
      if (max - min > 0.05) {
        issues.push({
          url: probes[0].url,
          code: "aspect_mismatch",
          message: `Imagens do carrossel têm rácios diferentes (${min.toFixed(2)}–${max.toFixed(2)}). O Instagram exige o mesmo rácio em todas.`,
        });
      }
    }
  }

  return { ok: issues.length === 0, probes, issues };
}

export function summarizeIssues(issues: ValidationIssue[]): string {
  if (!issues.length) return "";
  return issues.map((i) => `• ${i.message}`).join("\n");
}