import type { ChannelAdapter, ChannelResult, PublishingContext } from "../types.ts";
import { buildProductCaption, getProductUrl } from "../productFormatting.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { selectInstagramCarousel } from "../imageValidation.ts";
import { GRAPH, graphFetch, formatMetaError, resolveMetaCredentials } from "../metaClient.ts";
import { syncProductSocialStatus } from "../socialStatus.ts";

const CHANNEL_KEY = "instagram";
const MAX_CAROUSEL = 10;

// Poll intervals for container status_code=FINISHED (ms).
const POLL_INTERVALS_MS = [800, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000];

async function waitForContainerFinished(
  containerId: string,
  token: string,
): Promise<{ ok: true } | { ok: false; status: string; error?: any }> {
  for (const wait of POLL_INTERVALS_MS) {
    await new Promise((r) => setTimeout(r, wait));
    try {
      const res = await graphFetch(
        `${GRAPH}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(token)}`,
      );
      const json = await res.json().catch(() => ({}));
      const code = (json?.status_code as string) ?? "";
      if (code === "FINISHED") return { ok: true };
      if (code === "ERROR" || code === "EXPIRED") {
        return { ok: false, status: code, error: json };
      }
      // IN_PROGRESS / PUBLISHED / '' -> keep polling
    } catch (_) {
      // keep polling
    }
  }
  return { ok: false, status: "TIMEOUT" };
}

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
    const res = await graphFetch(
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
    const admin = createClient(ctx.supabaseUrl, ctx.serviceRoleKey);
    const { token, igUserId } = await resolveMetaCredentials(admin, ctx.channelConfig ?? {});
    if (!token || !igUserId) {
      return {
        status: "missing_credentials",
        response: {
          reason: "missing Meta token or Instagram business user id (OAuth connection or secrets)",
          missing: [!token ? "page_access_token" : null, !igUserId ? "ig_user_id" : null].filter(Boolean),
          required: ["META_PAGE_ACCESS_TOKEN", "META_IG_USER_ID"],
        },
        error:
          "Instagram não configurado: liga a conta Meta no painel (OAuth) ou define META_PAGE_ACCESS_TOKEN / META_IG_USER_ID",
      };
    }
    if (!ctx.product) {
      return { status: "failed", error: "Instagram: produto inexistente para este evento" };
    }

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
        const res = await graphFetch(
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
        // Estado global multi-canal (Facebook pode continuar publicado).
        await syncProductSocialStatus(admin, productId);
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
    const explicitImages = payload.image_urls as string[] | undefined;
    const requestedImages = explicitImages?.length
      ? explicitImages.slice(0, MAX_CAROUSEL)
      : explicitImage
      ? [explicitImage]
      : getOrderedImageUrls(ctx.product).slice(0, MAX_CAROUSEL);
    if (!requestedImages.length) {
      return {
        status: "failed",
        response: { reason: "instagram requires at least one public image" },
        error: "Instagram: o produto não tem imagens públicas — publicação não efetuada",
      };
    }

    // ---------- SELEÇÃO AUTOMÁTICA DE IMAGENS COMPATÍVEIS ----------
    // Em vez de ignorar a publicação, descartamos as imagens incompatíveis e
    // publicamos o maior conjunto válido com o mesmo rácio.
    const selection = await selectInstagramCarousel(requestedImages);
    const allImages = selection.urls;
    if (!allImages.length) {
      return {
        status: "failed",
        request: { step: "image_selection", images: requestedImages },
        response: { dropped: selection.dropped, probes: selection.probes },
        error:
          "Instagram: nenhuma imagem cumpre os requisitos (rácio 0.8–1.91, JPEG/PNG, ≤8MB).",
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
      let creationId: string;
      let publishRequest: Record<string, unknown>;

      if (allImages.length === 1) {
        // Single image container
        const res = await graphFetch(`${GRAPH}/${igUserId}/media`, {
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
        // Wait for FINISHED before publishing
        const ready = await waitForContainerFinished(creationId, token);
        if (!ready.ok) {
          return {
            status: "failed",
            request: { step: "wait_container", mode: "single", creation_id: creationId },
            response: (ready as any).error ?? { status: ready.status },
            error: `Instagram container não ficou pronto (status=${ready.status}).`,
          };
        }
        publishRequest = { mode: "single", imageUrl: allImages[0] };
      } else {
        // Carousel: create N child containers, then a parent CAROUSEL container.
        // Criação dos filhos em paralelo (a Graph API suporta-o) — reduz
        // drasticamente a latência face ao processamento sequencial.
        const childResults = await Promise.all(
          allImages.map(async (url) => {
            const res = await graphFetch(`${GRAPH}/${igUserId}/media`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                image_url: url,
                is_carousel_item: "true",
                access_token: token,
              }).toString(),
            });
            const json = await res.json().catch(() => ({}));
            return { url, ok: res.ok && !!json?.id, json, httpStatus: res.status };
          }),
        );
        const failedChild = childResults.find((c) => !c.ok);
        if (failedChild) {
          return {
            status: "failed",
            request: {
              step: "carousel_child",
              url: failedChild.url,
              so_far: childResults.filter((c) => c.ok).map((c) => c.json.id),
            },
            response: failedChild.json,
            error: formatMetaError(failedChild.json, failedChild.httpStatus),
          };
        }
        const childIds: string[] = childResults.map((c) => c.json.id as string);
        // Espera que todos os filhos fiquem FINISHED — também em paralelo.
        const readyChildren = await Promise.all(
          childIds.map(async (cid) => ({ cid, ready: await waitForContainerFinished(cid, token) })),
        );
        const notReady = readyChildren.find((c) => !c.ready.ok);
        if (notReady) {
          return {
            status: "failed",
            request: { step: "wait_child", child_id: notReady.cid },
            response: (notReady.ready as any).error ?? { status: (notReady.ready as any).status },
            error: `Instagram carousel child não ficou pronto (status=${(notReady.ready as any).status}).`,
          };
        }
        const parentRes = await graphFetch(`${GRAPH}/${igUserId}/media`, {
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
        // Wait parent FINISHED
        const readyParent = await waitForContainerFinished(creationId, token);
        if (!readyParent.ok) {
          return {
            status: "failed",
            request: { step: "wait_carousel_parent", creation_id: creationId },
            response: (readyParent as any).error ?? { status: readyParent.status },
            error: `Instagram carousel parent não ficou pronto (status=${readyParent.status}).`,
          };
        }
        publishRequest = { mode: "carousel", images: allImages, children: childIds };
      }

      // Publish container
      const pubRes = await graphFetch(`${GRAPH}/${igUserId}/media_publish`, {
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
      const { error: postLogError } = await admin.from("product_social_posts").insert({
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
      if (postLogError) {
        throw new Error(`Instagram publicado, mas falhou o registo interno: ${postLogError.message}`);
      }

      // Snapshot the hash at publish time (mirrors Facebook adapter).
      await admin.from("products").update({ social_caption: caption }).eq("id", productId);
      await syncProductSocialStatus(admin, productId);

      return {
        status: "success",
        request: { ...publishRequest, link, action: eventType, dropped_images: selection.dropped },
        response: { ...pubJson, external_url: externalUrl },
      };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  },
};