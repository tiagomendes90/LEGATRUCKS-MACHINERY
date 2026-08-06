import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";
import { buildProductCaption, getPrimaryImageUrl, getProductUrl } from "../productFormatting.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GRAPH, graphFetch, formatMetaError, resolveMetaCredentials } from "../metaClient.ts";
import { syncProductSocialStatus } from "../socialStatus.ts";

const CHANNEL_KEY = "facebook";

// Meta Graph API errors are flattened by `formatMetaError` (shared metaClient),
// while the full JSON payload is still persisted in `publishing_logs.response`.

// Fase 2.3: Facebook agora é acionado exclusivamente pelo administrador via
// eventos `social.publish.confirmed` / `social.delete` (aprovação manual).
// Deixou de reagir a `product.published`.
export const facebookChannel: ChannelAdapter = {
  key: CHANNEL_KEY,
  label: "Facebook",
  supports: (e) => {
    const targetChannel = (e.payload as any)?.channel;
    if (targetChannel && targetChannel !== CHANNEL_KEY) return false;
    return (
      e.event_type === "social.publish.confirmed" ||
      e.event_type === "social.republish" ||
      e.event_type === "social.delete"
    );
  },
  async publish(ctx: PublishingContext): Promise<ChannelResult> {
    const admin = createClient(ctx.supabaseUrl, ctx.serviceRoleKey);
    const { token, pageId } = await resolveMetaCredentials(admin, ctx.channelConfig ?? {});
    if (!token || !pageId) {
      return {
        status: "missing_credentials",
        response: {
          reason: "missing Meta page token or page id (OAuth connection or secrets)",
          missing: [!token ? "page_access_token" : null, !pageId ? "page_id" : null].filter(Boolean),
          required: ["META_PAGE_ACCESS_TOKEN", "META_PAGE_ID"],
        },
        error:
          "Facebook não configurado: liga a conta Meta no painel (OAuth) ou define META_PAGE_ACCESS_TOKEN / META_PAGE_ID",
      };
    }
    if (!ctx.product) {
      return { status: "failed", error: "Facebook: produto inexistente para este evento" };
    }

    const productId = ctx.product.id as string;
    const eventType = ctx.event.event_type;
    const payload = (ctx.event.payload ?? {}) as Record<string, unknown>;

    // ---------- DELETE ----------
    if (eventType === "social.delete") {
      const targetPostId =
        (payload.external_id as string | undefined) ??
        (await loadLatestExternalId(admin, productId));
      if (!targetPostId) {
        return { status: "skipped", response: { reason: "no external_id to delete" } };
      }
      try {
        const res = await graphFetch(
          `${GRAPH}/${targetPostId}?access_token=${encodeURIComponent(token)}`,
          { method: "DELETE" },
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            status: "failed",
            request: { endpoint: `DELETE ${targetPostId}` },
            response: json,
            error: formatMetaError(json, res.status),
          };
        }
        await admin
          .from("product_social_posts")
          .update({ status: "deleted", updated_at: new Date().toISOString() })
          .eq("product_id", productId)
          .eq("channel_key", CHANNEL_KEY)
          .eq("external_id", targetPostId);

        // Estado global multi-canal: só volta a ready_for_social se NENHUM
        // canal (Facebook ou Instagram) tiver publicação viva.
        await syncProductSocialStatus(admin, productId);
        return {
          status: "success",
          request: { action: "delete", external_id: targetPostId },
          response: json,
        };
      } catch (err) {
        return { status: "failed", error: err instanceof Error ? err.message : String(err) };
      }
    }

    // ---------- PUBLISH / REPUBLISH ----------
    const imageUrl =
      (payload.image_url as string | undefined) ?? getPrimaryImageUrl(ctx.product);
    const link = getProductUrl(ctx.product);
    const caption =
      (payload.caption as string | undefined) ??
      (ctx.product.social_caption as string | undefined) ??
      buildProductCaption(ctx.product, link);

    // For republish with delete_previous flag, drop the old post first (best-effort).
    if (eventType === "social.republish" && payload.delete_previous) {
      const prev = await loadLatestExternalId(admin, productId);
      if (prev) {
        await graphFetch(`${GRAPH}/${prev}?access_token=${encodeURIComponent(token)}`, {
          method: "DELETE",
        }).catch(() => {});
        await admin
          .from("product_social_posts")
          .update({ status: "deleted", updated_at: new Date().toISOString() })
          .eq("product_id", productId)
          .eq("channel_key", CHANNEL_KEY)
          .eq("external_id", prev);
      }
    }

    try {
      let endpoint: string;
      let body: Record<string, string>;
      if (imageUrl) {
        endpoint = `${GRAPH}/${pageId}/photos`;
        body = { url: imageUrl, caption, access_token: token };
      } else {
        endpoint = `${GRAPH}/${pageId}/feed`;
        body = { message: caption, link, access_token: token };
      }

      const res = await graphFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(body).toString(),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: "failed",
          request: { endpoint, hasImage: !!imageUrl },
          response: json,
          error: formatMetaError(json, res.status),
        };
      }

      // Facebook returns { id, post_id } for /photos, { id } for /feed.
      const postId = (json?.post_id as string | undefined) ?? (json?.id as string | undefined);
      const externalUrl = postId
        ? `https://www.facebook.com/${postId.replace(/^.*_/, `${pageId}/posts/`)}`
        : null;

      // Persist success in product_social_posts and mark product as published.
      const nowIso = new Date().toISOString();
      await admin.from("product_social_posts").insert({
        product_id: productId,
        channel_key: CHANNEL_KEY,
        event_id: ctx.event.id,
        external_id: postId,
        external_url: externalUrl,
        status: "published",
        published_at: nowIso,
        raw_response: json,
        media: { image_url: imageUrl, caption },
      });

      // Snapshot the hash at publish-time so future divergence flips to 'outdated'.
      await admin.from("products").update({ social_caption: caption }).eq("id", productId);
      await syncProductSocialStatus(admin, productId);

      return {
        status: "success",
        request: { endpoint, hasImage: !!imageUrl, link, action: eventType },
        response: { ...json, external_url: externalUrl },
      };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  },
};

async function loadLatestExternalId(admin: any, productId: string): Promise<string | null> {
  const { data } = await admin
    .from("product_social_posts")
    .select("external_id")
    .eq("product_id", productId)
    .eq("channel_key", CHANNEL_KEY)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.external_id as string | null) ?? null;
}
