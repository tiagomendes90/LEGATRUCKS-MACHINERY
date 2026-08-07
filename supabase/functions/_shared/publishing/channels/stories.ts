// ============================================================================
// Fase 3 — Stories automáticas (imagem) em Instagram e Facebook.
//
// Ao contrário dos adaptadores de feed, o criativo NÃO é derivado das fotos do
// produto: é o PNG 1080×1920 gerado no Media Studio, previamente carregado para
// o bucket público. O payload do evento traz sempre `image_url`.
//
// Evento suportado: `social.story.publish` (+ `social.delete` direcionado).
// O canal alvo é escolhido por `payload.channel` = instagram_story | facebook_story.
// ============================================================================
import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GRAPH, graphFetch, formatMetaError, resolveMetaCredentials } from "../metaClient.ts";
import { deleteSocialPost } from "../socialDelete.ts";

const POLL_INTERVALS_MS = [800, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000];

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
    return e.event_type === "social.story.publish" || e.event_type === "social.delete";
  };
}

async function recordStory(
  admin: any,
  params: {
    productId: string | null;
    channelKey: string;
    eventId: string;
    externalId: string | null;
    externalUrl: string | null;
    imageUrl: string;
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
    media: { image_url: params.imageUrl, kind: "story" },
  });
  if (error) {
    throw new Error(`Story publicada, mas falhou o registo interno: ${error.message}`);
  }
}

function missingImage(channel: string): ChannelResult {
  return {
    status: "failed",
    error: `${channel}: falta o criativo (image_url) — gere e carregue o Story no Media Studio antes de publicar.`,
  };
}

// ---------------------------------------------------------------- Instagram
export const instagramStoryChannel: ChannelAdapter = {
  key: "instagram_story",
  label: "Instagram Stories",
  supports: supportsFor("instagram_story") as ChannelAdapter["supports"],
  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    const admin = createClient(ctx.supabaseUrl, ctx.serviceRoleKey);
    const { token, igUserId } = await resolveMetaCredentials(admin, ctx.channelConfig ?? {});
    if (!token || !igUserId) {
      return {
        status: "missing_credentials",
        response: { missing: [!token ? "page_access_token" : null, !igUserId ? "ig_user_id" : null].filter(Boolean) },
        error: "Instagram Stories não configurado: liga a conta Meta no painel (OAuth).",
      };
    }

    const payload = (ctx.event.payload ?? {}) as Record<string, unknown>;
    const productId = (ctx.event.product_id as string | null) ?? null;

    if (ctx.event.event_type === "social.delete") {
      return await deleteSocialPost({
        admin,
        token,
        channelKey: "instagram_story",
        productId: productId as string,
        externalId: (payload.external_id as string | undefined) ?? null,
      });
    }

    const imageUrl = payload.image_url as string | undefined;
    if (!imageUrl) return missingImage("Instagram Stories");

    try {
      const res = await graphFetch(`${GRAPH}/${igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          media_type: "STORIES",
          image_url: imageUrl,
          access_token: token,
        }).toString(),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.id) {
        return {
          status: "failed",
          request: { step: "create_story_container", image_url: imageUrl },
          response: json,
          error: formatMetaError(json, res.status),
        };
      }
      const creationId = json.id as string;
      const ready = await waitForContainerFinished(creationId, token);
      if (!ready.ok) {
        return {
          status: "failed",
          request: { step: "wait_story_container", creation_id: creationId },
          response: (ready as any).error ?? { status: (ready as any).status },
          error: `Instagram Story: container não ficou pronto (status=${(ready as any).status}).`,
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

      await recordStory(admin, {
        productId,
        channelKey: "instagram_story",
        eventId: ctx.event.id,
        externalId: pubJson.id as string,
        externalUrl: null,
        imageUrl,
        raw: pubJson,
      });

      return {
        status: "success",
        request: { mode: "story", image_url: imageUrl },
        response: { ...pubJson, expires_in_hours: 24 },
      };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  },
};

// ----------------------------------------------------------------- Facebook
export const facebookStoryChannel: ChannelAdapter = {
  key: "facebook_story",
  label: "Facebook Stories",
  supports: supportsFor("facebook_story") as ChannelAdapter["supports"],
  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    const admin = createClient(ctx.supabaseUrl, ctx.serviceRoleKey);
    const { token, pageId } = await resolveMetaCredentials(admin, ctx.channelConfig ?? {});
    if (!token || !pageId) {
      return {
        status: "missing_credentials",
        response: { missing: [!token ? "page_access_token" : null, !pageId ? "page_id" : null].filter(Boolean) },
        error: "Facebook Stories não configurado: liga a conta Meta no painel (OAuth).",
      };
    }

    const payload = (ctx.event.payload ?? {}) as Record<string, unknown>;
    const productId = (ctx.event.product_id as string | null) ?? null;

    if (ctx.event.event_type === "social.delete") {
      return await deleteSocialPost({
        admin,
        token,
        channelKey: "facebook_story",
        productId: productId as string,
        externalId: (payload.external_id as string | undefined) ?? null,
      });
    }

    const imageUrl = payload.image_url as string | undefined;
    if (!imageUrl) return missingImage("Facebook Stories");

    try {
      // Passo 1 — upload da foto sem publicar no feed.
      const upRes = await graphFetch(`${GRAPH}/${pageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          url: imageUrl,
          published: "false",
          temporary: "true",
          access_token: token,
        }).toString(),
      });
      const upJson = await upRes.json().catch(() => ({}));
      if (!upRes.ok || !upJson?.id) {
        return {
          status: "failed",
          request: { step: "upload_photo", image_url: imageUrl },
          response: upJson,
          error: formatMetaError(upJson, upRes.status),
        };
      }

      // Passo 2 — publicar como Story da Página.
      const stRes = await graphFetch(`${GRAPH}/${pageId}/photo_stories`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ photo_id: upJson.id, access_token: token }).toString(),
      });
      const stJson = await stRes.json().catch(() => ({}));
      if (!stRes.ok || stJson?.success === false || (!stJson?.post_id && !stJson?.id)) {
        return {
          status: "failed",
          request: { step: "photo_stories", photo_id: upJson.id },
          response: stJson,
          error: formatMetaError(stJson, stRes.status),
        };
      }

      const postId = (stJson.post_id as string | undefined) ?? (stJson.id as string | undefined) ?? null;
      await recordStory(admin, {
        productId,
        channelKey: "facebook_story",
        eventId: ctx.event.id,
        externalId: postId,
        externalUrl: null,
        imageUrl,
        raw: stJson,
      });

      return {
        status: "success",
        request: { mode: "story", image_url: imageUrl, photo_id: upJson.id },
        response: { ...stJson, expires_in_hours: 24 },
      };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  },
};
