import "server-only";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { productCardInclude } from "./products";

export const SOLD_STATUSES: OrderStatus[] = ["PAID", "PREPARING", "SHIPPED", "DELIVERED", "PARTIALLY_REFUNDED"];

export function listProducts(where: Prisma.ProductWhereInput, opts: { take?: number; orderBy?: Prisma.ProductOrderByWithRelationInput[] } = {}) {
  return prisma.product.findMany({
    where: { isActive: true, ...where },
    include: productCardInclude,
    orderBy: opts.orderBy ?? [{ createdAt: "desc" }],
    take: opts.take,
  });
}

/** Meilleures ventes calculées à partir des VRAIES commandes payées. */
export async function bestSellers(take = 8) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { not: null }, order: { status: { in: SOLD_STATUSES } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take,
  });
  const ids = grouped.map((g) => g.productId!).filter(Boolean);
  if (ids.length === 0) return [];
  const products = await listProducts({ id: { in: ids } });
  return ids.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
}

/** Les promotions : prix barré supérieur au prix de vente */
export async function saleProducts(take?: number) {
  const ids = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "Product" WHERE "isActive" = true AND "compareAtPrice" IS NOT NULL AND "compareAtPrice" > price ORDER BY "updatedAt" DESC LIMIT ${take ?? 500}`;
  if (ids.length === 0) return [];
  return listProducts({ id: { in: ids.map((r) => r.id) } });
}
