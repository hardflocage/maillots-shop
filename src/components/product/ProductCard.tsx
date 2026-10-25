import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { KIT_LABELS } from "@/lib/labels";
import { backImage, isOnSale, primaryImage, totalStock, type ProductCardData } from "@/lib/products";
import { QuickViewButton } from "./QuickView";

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const front = primaryImage(product.images);
  const back = backImage(product.images);
  const sale = isOnSale(product);
  const stock = totalStock(product);
  const soldOut = stock === 0;
  const pct = sale ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;
  const svg = (u: string | null) => Boolean(u?.endsWith(".svg"));
  const sizesInStock = product.variants.filter((v) => v.stock > 0).length;

  return (
    <div className="group">
      <div className="relative">
        <Link href={`/maillot/${product.slug}`} className="block" aria-label={`${product.name}, ${formatPrice(product.price)}`}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-b from-ink-700 to-ink-800 ring-1 ring-inset ring-white/5">
            {front ? (
              <Image src={front} alt={`${product.name} : devant`} fill priority={priority} sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 46vw" className={`object-cover transition duration-700 ease-out group-hover:scale-[1.04] ${back ? "group-hover:opacity-0" : ""}`} unoptimized={svg(front)} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-bone-dim">Photo à venir</div>
            )}
            {back && (
              <Image src={back} alt={`${product.name} : dos`} fill sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 46vw" className="object-cover opacity-0 transition duration-700 ease-out group-hover:scale-[1.04] group-hover:opacity-100" unoptimized={svg(back)} />
            )}
            <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
              {product.isNew && <span className="rounded-full bg-bone px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">Nouveau</span>}
              {sale && <span className="rounded-full bg-signal px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">−{pct} %</span>}
              {product.isDemo && <span className="rounded-full border border-bone/30 bg-ink/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-bone-muted backdrop-blur">Démo</span>}
            </div>
            {soldOut && <div className="absolute inset-x-3 bottom-3 rounded-full bg-ink/80 py-2 text-center text-xs font-semibold uppercase tracking-wider text-bone-muted backdrop-blur">Rupture de stock</div>}
          </div>
        </Link>
        {!soldOut && (
          <div className="absolute right-3 top-3 transition duration-300 sm:inset-x-0 sm:bottom-4 sm:right-auto sm:top-auto sm:flex sm:translate-y-2 sm:justify-center sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-within:translate-y-0 sm:focus-within:opacity-100">
            <QuickViewButton slug={product.slug} name={product.name} />
          </div>
        )}
      </div>
      <Link href={`/maillot/${product.slug}`} tabIndex={-1} className="block">
        <div className="mt-3 px-0.5">
          <p className="truncate text-[11px] uppercase tracking-[0.16em] text-bone-dim">{product.club} · {product.season}</p>
          <h3 className="mt-1 line-clamp-2 text-[15px] font-medium leading-snug text-bone transition group-hover:text-gold">{product.name}</h3>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span className={`font-semibold ${sale ? "text-signal" : "text-bone"}`}>{formatPrice(product.price)}</span>
            {sale && <span className="text-sm text-bone-dim line-through">{formatPrice(product.compareAtPrice!)}</span>}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1 text-[11px] text-bone-dim">
            {soldOut ? (
              <span>Indisponible</span>
            ) : (
              <span className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${stock <= 3 ? "bg-gold" : "bg-pitch"}`} />{stock <= 3 ? `Plus que ${stock}` : `${sizesInStock} taille${sizesInStock > 1 ? "s" : ""} dispo`}</span>
            )}
            <span>· {KIT_LABELS[product.kitType]}</span>
            {product.customizationEnabled && !soldOut && <span>· Flocage</span>}
          </p>
        </div>
      </Link>
    </div>
  );
}
