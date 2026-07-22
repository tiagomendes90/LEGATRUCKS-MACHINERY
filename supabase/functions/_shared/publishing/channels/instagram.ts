import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";
import { buildProductCaption, getProductUrl } from "../productFormatting.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GRAPH = "https://graph.facebook.com/v19.0";
const CHANNEL_KEY = "instagram";
const MAX_CAROUSEL = 10;

/**
 * Fase 2.4 — Instagram.
 * Reutiliza integralmente a infraestrutura comum (dispatcher, eventos, logs,
 * product_social_posts, hash/social_status). Só a lógica específica da Graph
 * API do Instagram Business vive aqui.
 *
 * Regras de negócio:
 *   • 1 imagem   → publicação simples (image container + media_publish)
 *   • 2+ imagens → carrossel (até 10 crianças + container CAROUSEL)
 *   • social.publish.confirmed / social.republish → cria post
 *   • social.delete                                → apaga post no IG
 *   • republish com delete_previous               → apaga o post antigo antes
 */
function formatMetaError(json: any, httpStatus: number): string {
  const e = json?.error;
  if (!e) return `HTTP ${httpStatus}`;
  const parts: string[] = [];
  if (e.message) parts.push(e.message);
  const codeBits: string[] = [];
  if (e.code !== undefined) codeBits.push(`code=${e.code}`);
  if (e.error_subcode !== undefined) codeBits.push(`subcode=${e.error_subcode}`);
  if (e.type) codeBits.push(`type=${e.type}`);
  if (e.fbtrace_id) codeBits.push(`trace=${e.fbtrace_id}`);
  if (codeBits.length) parts.push(`[${codeBits.join(" ")}]`);
  parts.push(`(HTTP ${httpStatus})`);
  return parts.join(" ");
}

function getOrderedImageUrls(product: Record<string, unknown>): string[] {
  const imgs = (product.images as Array<any> | undefined) ?? [];
  return [...imgs]
    .sort((a, b) => {
      // primary first, then by sort_order
      if (!!b?.is_primary !== !!a?.is_primary) return b?.is_primary ? 1 : -1;
      return (a?.sort_order ?? 0) - (b?.sort_order ?? 0);
    })
    .map((i) => i?.image_url as string)
    .filter(Boolean);
}

async function fetchPermalink(mediaId: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${GRAPH}/${mediaId}?fields=permalink&access_token=${encodeURIComponent(token)}`,
    );
    const json = await res.json().catch(() => ({}));
    return (json?.permalink as string | undefined) ?? null;
  } catch {
    return null;
  }
}

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

export const instagramChannel: ChannelAdapter = {
  key: CHANNEL_KEY,
  label: "Instagram",
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
    const token =
      Deno.env.get("META_PAGE_ACCESS_TOKEN") ?? Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
    const igUserId =
      (ctx.channelConfig?.ig_user_id as string | undefined) ??
      Deno.env.get("META_IG_USER_ID") ??
      Deno.env.get("INSTAGRAM_USER_ID");
    if (!token || !igUserId) {
      return {
        status: "skipped",
        response: { reason: "missing META_PAGE_ACCESS_TOKEN or META_IG_USER_ID" },
      };
    }
    if (!ctx.product) {
      return { status: "skipped", response: { reason: "no product data" } };
    }

    const admin = createClient(ctx.supabaseUrl, ctx.serviceRoleKey);
    const productId = ctx.product.id as string;
    const eventType = ctx.event.event_type;
    const payload = (ctx.event.payload ?? {}) as Record<string, unknown>;

    // ---------- DELETE ----------
    if (eventType === "social.delete") {
      const targetId =
        (payload.external_id as string | undefined) ??
        (await loadLatestExternalId(admin, productId));
      if (!targetId) {
        return { status: "skipped", response: { reason: "no external_id to delete" } };
      }
      try {
        const res = await fetch(
          `${GRAPH}/${targetId}?access_token=${encodeURIComponent(token)}`,
          { method: "DELETE" },
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            status: "failed",
            request: { endpoint: `DELETE ${targetId}` },
            response: json,
            error: formatMetaError(json, res.status),
          };
        }
        await admin
          .from("product_social_posts")
          .update({ status: "deleted", updated_at: new Date().toISOString() })
          .eq("product_id", productId)
          .eq("channel_key", CHANNEL_KEY)
          .eq("external_id", targetId);

        const { count } = await admin
          .from("product_social_posts")
          .select("*", { count: "exact", head: true })
          .eq("product_id", productId)
          .eq("channel_key", CHANNEL_KEY)
          .eq("status", "published");
        // Note: we don't flip social_status here — Facebook may still be live.
        return {
          status: "success",
          request: { action: "delete", external_id: targetId, remaining: count ?? 0 },
          response: json,
        };
      } catch (err) {
        return { status: "failed", error: err instanceof Error ? err.message : String(err) };
      }
    }

    // ---------- PUBLISH / REPUBLISH ----------
    const explicitImage = payload.image_url as string | undefined;
    const allImages = explicitImage
      ? [explicitImage]
      : getOrderedImageUrls(ctx.product).slice(0, MAX_CAROUSEL);
    if (!allImages.length) {
      return {
        status: "skipped",
        response: { reason: "instagram requires at least one public image" },
      };
    }
    const link = getProductUrl(ctx.product);
    const caption =
      (payload.caption as string | undefined) ??
      (ctx.product.social_caption as string | undefined) ??
      buildProductCaption(ctx.product, link, { includeLinkInCaption: true });

    if (eventType === "social.republish" && payload.delete_previous) {
      const prev = await loadLatestExternalId(admin, productId);
      if (prev) {
        await fetch(`${GRAPH}/${prev}?access_token=${encodeURIComponent(token)}`, {
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
      let creationId: string;
      let publishRequest: Record<string, unknown>;

      if (allImages.length === 1) {
        // Single image container
        const res = await fetch(`${GRAPH}/${igUserId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            image_url: allImages[0],
            caption,
            access_token: token,
          }).toString(),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.id) {
          return {
            status: "failed",
            request: { step: "create_container", mode: "single" },
            response: json,
            error: formatMetaError(json, res.status),
          };
        }
        creationId = json.id;
        publishRequest = { mode: "single", imageUrl: allImages[0] };
      } else {
        // Carousel: create N child containers, then a parent CAROUSEL container.
        const childIds: string[] = [];
        for (const url of allImages) {
          const res = await fetch(`${GRAPH}/${igUserId}/media`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              image_url: url,
              is_carousel_item: "true",
              access_token: token,
            }).toString(),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || !json?.id) {
            return {
              status: "failed",
              request: { step: "carousel_child", url, so_far: childIds },
              response: json,
              error: formatMetaError(json, res.status),
            };
          }
          childIds.push(json.id);
        }
        const parentRes = await fetch(`${GRAPH}/${igUserId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            media_type: "CAROUSEL",
            caption,
            children: childIds.join(","),
            access_token: token,
          }).toString(),
        });
        const parentJson = await parentRes.json().catch(() => ({}));
        if (!parentRes.ok || !parentJson?.id) {
          return {
            status: "failed",
            request: { step: "carousel_parent", children: childIds },
            response: parentJson,
            error: formatMetaError(parentJson, parentRes.status),
          };
        }
        creationId = parentJson.id;
        publishRequest = { mode: "carousel", images: allImages, children: childIds };
      }

      // Publish container
      const pubRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          creation_id: creationId,
          access_token: token,
        }).toString(),
      });
      const pubJson = await pubRes.json().catch(() => ({}));
      if (!pubRes.ok || !pubJson?.id) {
        return {
          status: "failed",
          request: { step: "media_publish", creation_id: creationId, ...publishRequest },
          response: pubJson,
          error: formatMetaError(pubJson, pubRes.status),
        };
      }
      const mediaId = pubJson.id as string;
      const externalUrl = await fetchPermalink(mediaId, token);

      const nowIso = new Date().toISOString();
      await admin.from("product_social_posts").insert({
        product_id: productId,
        channel_key: CHANNEL_KEY,
        event_id: ctx.event.id,
        external_id: mediaId,
        external_url: externalUrl,
        status: "published",
        published_at: nowIso,
        raw_response: pubJson,
        media: { images: allImages, caption, mode: publishRequest.mode },
      });

      // Snapshot the hash at publish time (mirrors Facebook adapter).
      const { data: hashRow } = await admin
        .from("products")
        .select("social_hash")
        .eq("id", productId)
        .maybeSingle();
      await admin
        .from("products")
        .update({
          social_status: "published",
          social_caption: caption,
          social_hash: hashRow?.social_hash ?? null,
        })
        .eq("id", productId);

      return {
        status: "success",
        request: { ...publishRequest, link, action: eventType },
        response: { ...pubJson, external_url: externalUrl },
      };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  },
};