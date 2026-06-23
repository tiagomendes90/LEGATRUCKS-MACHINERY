export type ProductImageLike = {
  id?: string | null;
  image_url?: string | null;
  is_primary?: boolean | null;
  sort_order?: number | null;
};

const imagePosition = (image: ProductImageLike) => image.sort_order ?? Number.MAX_SAFE_INTEGER;

export const sortProductImages = <T extends ProductImageLike>(images?: T[] | null): T[] => {
  if (!Array.isArray(images)) return [];

  return [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return imagePosition(a) - imagePosition(b);
  });
};

export const getPrimaryImageUrl = (images?: ProductImageLike[] | null): string | undefined => {
  return sortProductImages(images).find((image) => Boolean(image.image_url))?.image_url ?? undefined;
};

export const getGalleryImageUrls = (images?: ProductImageLike[] | null): string[] => {
  return sortProductImages(images)
    .map((image) => image.image_url)
    .filter((url): url is string => Boolean(url));
};