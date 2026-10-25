import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { quickUpdateStock } from "@/app/actions/admin";
import { PageTitle } from "@/components/admin/ui";

export default async function StocksPage({ searchParams }: { searchParams: Promise<{ bas?: string }> }) {
  const { bas } = await searchParams;
  const products = await prisma.product.findMany({ include: { variants: { orderBy: { sortOrder: "asc" } } }, orderBy: { name: "asc" } });
  const list = bas ? products.filter((p) => p.variants.some((v) => v.stock <= v.lowStockThreshold)) : products;
  return (
    <div>
      <PageTitle title="Stocks par taille" subtitle="Modifiez les quantités puis enregistrez. Les ventes décrémentent le stock automatiquement.">
        <Link href={bas ? "/admin/stocks" : "/admin/stocks?bas=1"} className="btn-ghost">{bas ? "Tout afficher" : "Stocks bas uniquement"}</Link>
      </PageTitle>
      <form action={quickUpdateStock} className="space-y-3">
        {list.map((p) => (
          <div key={p.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <Link href={`/admin/produits/${p.id}`} className="w-64 shrink-0 text-sm font-medium hover:text-gold">{p.name}{!p.isActive && <span className="ml-1 text-xs text-bone-dim">(masqué)</span>}</Link>
            <div className="flex flex-wrap gap-2">
              {p.variants.map((v) => (
                <label key={v.id} className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-2 py-1 text-xs">
                  <span className="w-12 text-bone-muted">{v.size}</span>
                  <input name={`stock_${v.id}`} type="number" min={0} defaultValue={v.stock} className={`w-16 rounded bg-ink-700 px-2 py-1.5 text-sm ${v.stock <= 0 ? "text-signal" : v.stock <= v.lowStockThreshold ? "text-gold" : ""}`} />
                </label>
              ))}
            </div>
          </div>
        ))}
        <div className="sticky bottom-0 bg-ink py-4"><button className="btn-primary">Enregistrer les stocks</button></div>
      </form>
    </div>
  );
}
