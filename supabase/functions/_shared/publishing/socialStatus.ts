// Single source of truth for products.social_status across ALL social channels.
// Regra: o estado global nunca depende de um único canal.
//   • existe pelo menos 1 post 'published' em qualquer canal → 'published'
//     (ou 'outdated' se o hash atual divergir do hash publicado)
//   • nenhum post vivo → 'ready_for_social' (se o produto estiver ativo)
export const SOCIAL_CHANNEL_KEYS = ["facebook", "instagram"] as const;

export async function syncProductSocialStatus(
  admin: any,
  productId: string,
  opts: { publishedHash?: string | null } = {},
): Promise<string | null> {
  if (!productId) return null;

  const { count } = await admin
    .from("product_social_posts")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .in("channel_key", SOCIAL_CHANNEL_KEYS as unknown as string[])
    .eq("status", "published");

  const { data: product } = await admin
    .from("products")
    .select("is_active, social_hash, social_status")
    .eq("id", productId)
    .maybeSingle();

  if (!product) return null;

  let next: string;
  if ((count ?? 0) > 0) {
    const publishedHash = opts.publishedHash ?? product.social_hash ?? null;
    next =
      publishedHash && product.social_hash && publishedHash !== product.social_hash
        ? "outdated"
        : "published";
  } else {
    next = product.is_active ? "ready_for_social" : "not_ready";
  }

  if (next !== product.social_status) {
    await admin.from("products").update({ social_status: next }).eq("id", productId);
  }
  return next;
}
