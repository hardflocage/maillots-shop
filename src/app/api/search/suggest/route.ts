import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { primaryImage } from "@/lib/products";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 60) ?? "";
  if (q.length < 2) return NextResponse.json({ products: [], clubs: [], players: [], categories: [] });
  const contains = { contains: q, mode: "insensitive" as const };
  const [products, clubs, players, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, OR: [{ name: contains }, { club: contains }, { season: contains }, { players: { some: { name: contains } } }] },
      include: { images: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ where: { isActive: true, club: contains }, distinct: ["club"], select: { club: true }, take: 5 }),
    prisma.player.findMany({ where: { name: contains, product: { isActive: true } }, select: { name: true, number: true, product: { select: { slug: true } } }, take: 5 }),
    prisma.category.findMany({ where: { isActive: true, name: contains }, select: { name: true, slug: true }, take: 4 }),
  ]);
  return NextResponse.json({
    products: products.map((p) => ({ slug: p.slug, name: p.name, price: p.price, image: primaryImage(p.images) })),
    clubs: clubs.map((c) => c.club),
    players: players.map((p) => ({ name: p.name, number: p.number, slug: p.product.slug })),
    categories,
  });
}
