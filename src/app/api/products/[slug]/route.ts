import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderedImages } from "@/lib/products";

/** Données publiques d'un maillot pour la vue rapide (aucune donnée privée). */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { images: true, variants: { orderBy: { sortOrder: "asc" } } },
  });
  if (!p) return NextResponse.json({ error: "Maillot introuvable" }, { status: 404 });
  return NextResponse.json({
    id: p.id,
    slug: p.slug,
    name: p.name,
    club: p.club,
    season: p.season,
    kitType: p.kitType,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    description: p.description.slice(0, 400),
    customizationEnabled: p.customizationEnabled,
    customizationPrice: p.customizationPrice,
    images: orderedImages(p.images).map((i) => ({ url: i.url, kind: i.kind })),
    variants: p.variants.map((v) => ({ id: v.id, size: v.size, stock: Math.max(v.stock, 0) })),
  });
}
