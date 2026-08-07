import { supabase } from "@/admin/supabaseClient";

/**
 * Carrega um criativo (PNG 1080×1920) para o bucket público `product-images`,
 * sob o prefixo `creatives/`, e devolve o URL público.
 *
 * A Meta Graph API só aceita URLs públicos (não aceita base64), por isso o
 * criativo tem de estar acessível antes de qualquer publicação de Story.
 */
export async function uploadCreative(
  blob: Blob,
  opts: { productId: string; kind: string; fileBase: string },
): Promise<string> {
  const path = `creatives/${opts.productId}/${opts.kind}-${Date.now()}-${opts.fileBase}.png`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, blob, { contentType: "image/png", upsert: true, cacheControl: "3600" });

  if (error) {
    throw new Error(`Falha ao carregar o criativo para o storage: ${error.message}`);
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Não foi possível obter o URL público do criativo.");
  }
  return data.publicUrl;
}

/**
 * Carrega um vídeo vertical (MP4 9:16) para o bucket público, sob o prefixo
 * `creatives/`, e devolve o URL público — requisito da Meta para publicar Reels.
 */
export async function uploadCreativeVideo(
  file: File,
  opts: { productId: string; fileBase: string },
): Promise<string> {
  const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
  const path = `creatives/${opts.productId}/reel-${Date.now()}-${opts.fileBase}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, {
      contentType: file.type || "video/mp4",
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Falha ao carregar o vídeo para o storage: ${error.message}`);
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Não foi possível obter o URL público do vídeo.");
  }
  return data.publicUrl;
}
