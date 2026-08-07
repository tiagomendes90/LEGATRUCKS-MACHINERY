// ============================================================================
// Fase 2 — Reels automáticos (vídeo) em Instagram e Facebook.
//
// O vídeo MP4 9:16 é carregado pelo administrador no Media Studio para o bucket
// público; o payload do evento traz sempre `video_url` (e opcionalmente
// `caption` / `cover_url` / `title`).
//
// Evento suportado: `social.reel.publish` (+ `social.delete` direcionado).
// Canal alvo por `payload.channel` = instagram_reel | facebook_reel.
// ============================================================================
import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GRAPH, graphFetch, formatMetaError, resolveMetaCredentials } from "../metaClient.ts";
import { deleteSocialPost } from "../socialDelete.ts";

// O processamento de vídeo é bem mais lento que o de imagem.
const POLL_INTERVALS_MS = [
  3000, 4000, 5000, 5000, 6000, 6000, 8000, 8000, 10000, 10000, 12000, 12000, 15000, 15000,
];

async function waitForContainerFinished(
  containerId: string,
  token: string,
): Promise<{ ok: true } | { ok: false; status: string; error?: unknown }> {
  for (const wait of POLL_INTERVALS_MS) {
    await new Promise((r) => setTimeout(r, wait));
    try {
      const res = await graphFetch(
        `${GRAPH}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(token)}`,
      );
      const json = await res.json().catch(() => ({}));
      const code = (json?.status_code as string) ?? "";
      if (code === "FINISHED") return { ok: true };
      if (code === "ERROR" || code === "EXPIRED") return { ok: false, status: code, error: json };
    } catch (_) {
      // continua a sondar
    }
  }
  return { ok: false, status: "TIMEOUT" };
}

function supportsFor(channelKey: string) {
  return (e: { event_type: string; payload?: Record<string, unknown> }) => {
    const target = (e.payload as any)?.channel;
    if (target !== channelKey) return false;
    return e.event_type === "social.reel.publish" || e.event_type === "social.delete";
  };
}

async function recordReel(
  admin: any,
  params: {
    productId: string | null;
    channelKey: string;
    eventId: string;
    externalId: string | null;
    externalUrl: string | null;
    videoUrl: string;
    caption: string | null;
    raw: Record<string, unknown>;
  },
) {
  const { error } = await admin.from("product_social_posts").insert({
    product_id: params.productId,
    channel_key: params.channelKey,
    event_id: params.eventId,
    external_id: params.externalId,
    external_url: params.externalUrl,
    status: "published",
    published_at: new Date().toISOString(),
    raw_response: params.raw,
    caption: params.caption,
    media: { video_url: params.videoUrl, kind: "reel" },
  });
  if (error) {
    throw new Error(`Reel publicado, mas falhou o registo interno: ${error.message}`);
  }
}

function missingVideo(channel: string): ChannelResult {
  return {
    status: "failed",
    error: `${channel}: falta o vídeo (video_url) — carregue um MP4 vertical no Media Studio antes de publicar.`,
  };
}

// ---------------------------------------------------------------- Instagram
export const instagramReelChannel: ChannelAdapter = {
  key: "instagram_reel",
  label: "Instagram Reels",
  supports: supportsFor("instagram_reel") as ChannelAdapter["supports"],
  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    const admin = createClient(ctx.supabaseUrl, ctx.serviceRoleKey);
    const { token, igUserId } = await resolveMetaCredentials(admin, ctx.channelConfig ?? {});
    if (!token || !igUserId) {
      return {
        status: "missing_credentials",
        response: { missing: [!token ? "page_access_token" : null, !igUserId ? "ig_user_id" : null].filter(Boolean) },
        error: "Instagram Reels não configurado: liga a conta Meta no painel (OAuth).",
      };
    }

    const payload = (ctx.event.payload ?? {}) as Record<string, unknown>;
    const productId = (ctx.event.product_id as string | null) ?? null;

    if (ctx.event.event_type === "social.delete") {
      return await deleteSocialPost({
        admin,
        token,
        channelKey: "instagram_reel",
        productId: productId as string,
        externalId: (payload.external_id as string | undefined) ?? null,
      });
    }

    const videoUrl = payload.video_url as string | undefined;
    if (!videoUrl) return missingVideo("Instagram Reels");
    const caption = (payload.caption as string | undefined) ?? null;
    const coverUrl = payload.cover_url as string | undefined;

    try {
      const params: Record<string, string> = {
        media_type: "REELS",
        video_url: videoUrl,
        share_to_feed: "true",
        access_token: token,
      };
      if (caption) params.caption = caption;
      if (coverUrl) params.cover_url = coverUrl;

      const res = await graphFetch(`${GRAPH}/${igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params).toString(),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.id) {
        return {
          status: "failed",
          request: { step: "create_reel_container", video_url: videoUrl },
          response: json,
          error: formatMetaError(json, res.status),
        };
      }

      const creationId = json.id as string;
      const ready = await waitForContainerFinished(creationId, token);
      if (!ready.ok) {
        return {
          status: "failed",
          request: { step: "wait_reel_container", creation_id: creationId },
          response: (ready as any).error ?? { status: (ready as any).status },
          error: `Instagram Reel: o vídeo não ficou pronto (status=${(ready as any).status}).`,
        };
      }

      const pubRes = await graphFetch(`${GRAPH}/${igUserId}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ creation_id: creationId, access_token: token }).toString(),
      });
      const pubJson = await pubRes.json().catch(() => ({}));
      if (!pubRes.ok || !pubJson?.id) {
        return {
          status: "failed",
          request: { step: "media_publish", creation_id: creationId },
          response: pubJson,
          error: formatMetaError(pubJson, pubRes.status),
        };
      }

      await recordReel(admin, {
        productId,
        channelKey: "instagram_reel",
        eventId: ctx.event.id,
        externalId: pubJson.id as string,
        externalUrl: null,
        videoUrl,
        caption,
        raw: pubJson,
      });

      return {
        status: "success",
        request: { mode: "reel", video_url: videoUrl },
        response: pubJson,
      };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  },
};

// ----------------------------------------------------------------- Facebook
export const facebookReelChannel: ChannelAdapter = {
  key: "facebook_reel",
  label: "Facebook Reels",
  supports: supportsFor("facebook_reel") as ChannelAdapter["supports"],
  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    const admin = createClient(ctx.supabaseUrl, ctx.serviceRoleKey);
    const { token, pageId } = await resolveMetaCredentials(admin, ctx.channelConfig ?? {});
    if (!token || !pageId) {
      return {
        status: "missing_credentials",
        response: { missing: [!token ? "page_access_token" : null, !pageId ? "page_id" : null].filter(Boolean) },
        error: "Facebook Reels não configurado: liga a conta Meta no painel (OAuth).",
      };
    }

    const payload = (ctx.event.payload ?? {}) as Record<string, unknown>;
    const productId = (ctx.event.product_id as string | null) ?? null;

    if (ctx.event.event_type === "social.delete") {
      return await deleteSocialPost({
        admin,
        token,
        channelKey: "facebook_reel",
        productId: productId as string,
        externalId: (payload.external_id as string | undefined) ?? null,
      });
    }

    const videoUrl = payload.video_url as string | undefined;
    if (!videoUrl) return missingVideo("Facebook Reels");
    const caption = (payload.caption as string | undefined) ?? null;

    try {
      // Passo 1 — iniciar a sessão de upload.
      const startRes = await graphFetch(`${GRAPH}/${pageId}/video_reels`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ upload_phase: "start", access_token: token }).toString(),
      });
      const startJson = await startRes.json().catch(() => ({}));
      if (!startRes.ok || !startJson?.video_id || !startJson?.upload_url) {
        return {
          status: "failed",
          request: { step: "start_upload_session" },
          response: startJson,
          error: formatMetaError(startJson, startRes.status),
        };
      }

      // Passo 2 — transferir o ficheiro a partir do URL público (hosted upload).
      const upRes = await graphFetch(startJson.upload_url as string, {
        method: "POST",
        headers: {
          Authorization: `OAuth ${token}`,
          file_url: videoUrl,
        },
      });
      const upJson = await upRes.json().catch(() => ({}));
      if (!upRes.ok || upJson?.success === false) {
        return {
          status: "failed",
          request: { step: "transfer_video", video_id: startJson.video_id },
          response: upJson,
          error: formatMetaError(upJson, upRes.status),
        };
      }

      // Passo 3 — finalizar e publicar.
      const finishParams: Record<string, string> = {
        upload_phase: "finish",
        video_id: startJson.video_id as string,
        video_state: "PUBLISHED",
        access_token: token,
      };
      if (caption) finishParams.description = caption;

      const finRes = await graphFetch(
        `${GRAPH}/${pageId}/video_reels?${new URLSearchParams(finishParams).toString()}`,
        { method: "POST" },
      );
      const finJson = await finRes.json().catch(() => ({}));
      if (!finRes.ok || finJson?.success === false) {
        return {
          status: "failed",
          request: { step: "finish_upload", video_id: startJson.video_id },
          response: finJson,
          error: formatMetaError(finJson, finRes.status),
        };
      }

      const videoId = startJson.video_id as string;
      await recordReel(admin, {
        productId,
        channelKey: "facebook_reel",
        eventId: ctx.event.id,
        externalId: videoId,
        externalUrl: `https://www.facebook.com/reel/${videoId}`,
        videoUrl,
        caption,
        raw: { ...finJson, video_id: videoId },
      });

      return {
        status: "success",
        request: { mode: "reel", video_url: videoUrl },
        response: { ...finJson, video_id: videoId },
      };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  },
};
