import Link from "next/link";
import type { ProductCardData } from "@/lib/products";
import { ProductCard } from "./ProductCard";

export function ProductRail({ eyebrow, title, href, products }: { eyebrow?: string; title: string; href?: string; products: ProductCardData[] }) {
  if (products.length === 0) return null;
  return (
    <section className="container-x py-14 sm:py-20">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h2 className="h-display text-4xl sm:text-5xl lg:text-6xl">{title}</h2>
        </div>
        {href && <Link href={href} className="shrink-0 border-b border-bone/30 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-bone-muted transition hover:border-gold hover:text-gold">Tout voir</Link>}
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.slice(0, 8).map((p) => (
          <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-auto">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
