import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productCardInclude } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";

export const metadata: Metadata = { title: "Mes favoris", robots: { index: false } };

export default async function FavoritesPage() {
  const user = await requireUser("/compte/favoris");
  const favs = await prisma.favorite.findMany({ where: { userId: user.id, product: { isActive: true } }, include: { product: { include: productCardInclude } }, orderBy: { createdAt: "desc" } });
  if (favs.length === 0) return <div className="card p-8 text-bone-muted">Aucun favori. Clique sur le cœur d&apos;un maillot pour le retrouver ici. <Link href="/boutique" className="text-bone underline">Voir la boutique</Link></div>;
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
      {favs.map((f) => <li key={f.productId}><ProductCard product={f.product} /></li>)}
    </ul>
  );
}
