import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { primaryImage } from "@/lib/products";
import { PageTitle, Table } from "@/components/admin/ui";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; vue?: string }> }) {
  const { q, vue } = await searchParams;
  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { club: { contains: q, mode: "insensitive" } }] } : {}),
    ...(vue === "masques" ? { isActive: false } : vue === "rupture" ? { variants: { every: { stock: { lte: 0 } } } } : {}),
  };
  const products = await prisma.product.findMany({ where, include: { images: true, variants: true, categories: { select: { name: true } } }, orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <PageTitle title="Produits" subtitle={`${products.length} produit(s)`}>
        <Link href="/admin/produits/nouveau" className="btn-primary">+ Ajouter un maillot</Link>
      </PageTitle>
      <form className="mb-5 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Rechercher (nom, club)…" className="input max-w-xs" />
        <select name="vue" defaultValue={vue ?? ""} className="input max-w-[200px]">
          <option value="">Tous</option>
          <option value="masques">Masqués</option>
          <option value="rupture">En rupture totale</option>
        </select>
        <button className="btn-ghost">Filtrer</button>
      </form>
      <Table head={["", "Produit", "Prix", "Stock par taille", "Statut"]}>
        {products.map((p) => {
          const img = primaryImage(p.images);
          const total = p.variants.reduce((s, v) => s + v.stock, 0);
          return (
            <tr key={p.id} className="hover:bg-white/5">
              <td className="w-16 px-4 py-3">
                <div className="relative h-14 w-11 overflow-hidden rounded bg-ink-700">{img && <Image src={img} alt="" fill sizes="44px" className="object-cover" unoptimized={img.endsWith(".svg")} />}</div>
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/produits/${p.id}`} className="font-medium hover:text-gold">{p.name}</Link>
                <span className="block text-xs text-bone-dim">{p.categories.map((c) => c.name).join(", ") || "Sans catégorie"}{p.isDemo && " · DÉMO"}</span>
                {(!p.images.some((i) => i.kind === "FRONT") || !p.images.some((i) => i.kind === "BACK")) && <span className="block text-xs text-signal">Photo devant ou dos manquante</span>}
              </td>
              <td className="px-4 py-3">{formatPrice(p.price)}{p.compareAtPrice && p.compareAtPrice > p.price && <span className="block text-xs text-signal line-through">{formatPrice(p.compareAtPrice)}</span>}</td>
              <td className="px-4 py-3 text-xs">
                <span className={`font-semibold ${total === 0 ? "text-signal" : ""}`}>{total}</span>{" "}
                <span className="text-bone-dim">{p.variants.sort((a, b) => a.sortOrder - b.sortOrder).map((v) => `${v.size}:${v.stock}`).join(" · ")}</span>
              </td>
              <td className="px-4 py-3">{p.isActive ? <span className="text-pitch">En ligne</span> : <span className="text-bone-dim">Masqué</span>}</td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
