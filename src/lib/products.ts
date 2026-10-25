import type { Prisma, ProductImage } from "@prisma/client";

type Img = Pick<ProductImage, "url" | "kind" | "sortOrder">;

export function primaryImage(images: Img[]) {
  return (images.find((i) => i.kind === "FRONT") ?? images[0])?.url ?? null;
}

export function backImage(images: Img[]) {
  return images.find((i) => i.kind === "BACK")?.url ?? null;
}

/** Ordre de la galerie : devant, dos, puis photos supplémentaires */
export function orderedImages<T extends Img>(images: T[]) {
  const rank = { FRONT: 0, BACK: 1, EXTRA: 2 } as const;
  return [...images].sort((a, b) => rank[a.kind] - rank[b.kind] || a.sortOrder - b.sortOrder);
}

export const productCardInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  variants: { select: { size: true, stock: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductInclude;

export type ProductCardData = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export function isOnSale(p: { price: number; compareAtPrice: number | null }) {
  return p.compareAtPrice != null && p.compareAtPrice > p.price;
}

export function totalStock(p: { variants: { stock: number }[] }) {
  return p.variants.reduce((s, v) => s + Math.max(v.stock, 0), 0);
}
