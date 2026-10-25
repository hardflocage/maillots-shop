"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatPrice } from "@/lib/format";
import { KIT_LABELS } from "@/lib/labels";
import { IconClose, IconZoom } from "@/components/ui/Icons";
import { useCart } from "@/components/cart/CartProvider";

type QuickProduct = {
  id: string;
  slug: string;
  name: string;
  club: string;
  season: string;
  kitType: keyof typeof KIT_LABELS;
  price: number;
  compareAtPrice: number | null;
  description: string;
  customizationEnabled: boolean;
  customizationPrice: number;
  images: { url: string; kind: "FRONT" | "BACK" | "EXTRA" }[];
  variants: { id: string; size: string; stock: number }[];
};

/** Bouton « Aperçu rapide » d'une carte produit : taille + ajout au panier sans quitter la page. */
export function QuickViewButton({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="flex items-center gap-1.5 rounded-full bg-bone/95 p-2.5 text-[11px] font-bold uppercase tracking-wider text-ink shadow-lg transition hover:bg-gold sm:px-3.5 sm:py-2"
        aria-label={`Aperçu rapide : ${name}`}
      >
        <IconZoom width={14} height={14} /> <span className="hidden sm:inline">Aperçu rapide</span>
      </button>
      {open && <QuickViewModal slug={slug} onClose={() => setOpen(false)} />}
    </>
  );
}

function QuickViewModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { add } = useCart();
  const [product, setProduct] = useState<QuickProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/products/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Maillot indisponible"))))
      .then((p: QuickProduct) => alive && setProduct(p))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const variant = product?.variants.find((v) => v.id === variantId) ?? null;
  const soldOut = product ? product.variants.every((v) => v.stock <= 0) : false;
  const sale = product?.compareAtPrice != null && product.compareAtPrice > product.price;
  const img = product?.images[view] ?? product?.images[0];

  const submit = () => {
    setTouched(true);
    if (!product || !variant || variant.stock <= 0) return;
    add({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      size: variant.size,
      image: product.images.find((i) => i.kind === "FRONT")?.url ?? product.images[0]?.url ?? null,
      unitPrice: product.price,
      customizationPrice: 0,
      quantity: 1,
      customization: null,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={product?.name ?? "Aperçu rapide"}>
      <div className="absolute inset-0 animate-fade-in bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-4xl animate-fade-up flex-col overflow-hidden rounded-t-3xl border border-ink-600 bg-ink-900 sm:rounded-3xl md:flex-row">
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full bg-ink/70 p-2 backdrop-blur" aria-label="Fermer"><IconClose /></button>
        {!product ? (
          <div className="flex h-72 w-full items-center justify-center text-bone-muted">{error ?? "Chargement…"}</div>
        ) : (
          <>
            <div className="relative md:w-1/2">
              <div className="relative aspect-[4/5] max-h-[46dvh] w-full bg-gradient-to-b from-ink-700 to-ink-800 md:max-h-none">
                {img && <Image key={img.url} src={img.url} alt={`${product.name}${img.kind === "BACK" ? " : dos" : " : devant"}`} fill sizes="(min-width:768px) 448px, 100vw" className="animate-fade-in object-cover" unoptimized={img.url.endsWith(".svg")} />}
              </div>
              {product.images.length > 1 && (
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                  {product.images.slice(0, 2).map((im, i) => (
                    <button key={im.url} onClick={() => setView(i)} className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur transition ${view === i ? "bg-bone text-ink" : "bg-ink/70 text-bone"}`}>
                      {im.kind === "BACK" ? "Dos" : "Devant"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto p-6 sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.18em] text-bone-dim">{product.club} · {product.season} · {KIT_LABELS[product.kitType]}</p>
              <h2 className="mt-2 font-display text-3xl uppercase leading-none sm:text-4xl">{product.name}</h2>
              <p className="mt-3 flex items-baseline gap-2">
                <span className={`text-2xl font-semibold ${sale ? "text-signal" : ""}`}>{formatPrice(product.price)}</span>
                {sale && <span className="text-bone-dim line-through">{formatPrice(product.compareAtPrice!)}</span>}
              </p>
              {product.description && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-bone-muted">{product.description}</p>}

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="label mb-0">Taille</p>
                  <Link href="/guide-des-tailles" target="_blank" className="text-xs text-bone-muted underline underline-offset-4">Guide des tailles</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      disabled={v.stock <= 0}
                      onClick={() => setVariantId(v.id)}
                      className={`min-w-[3.25rem] rounded-xl border px-3 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through ${variantId === v.id ? "border-gold bg-gold text-ink" : "border-ink-500 hover:border-bone/50"}`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
                {variant && variant.stock > 0 && variant.stock <= 3 && <p className="mt-2 text-xs text-gold">Plus que {variant.stock} en stock</p>}
                {touched && !variant && <p className="mt-2 text-xs text-signal">Choisis ta taille.</p>}
              </div>

              <div className="mt-auto space-y-3 pt-8">
                <button onClick={submit} disabled={soldOut} className="btn-primary w-full py-4">
                  {soldOut ? "Rupture de stock" : `Ajouter au panier${variant ? ` · ${formatPrice(product.price)}` : ""}`}
                </button>
                <Link href={`/maillot/${product.slug}`} onClick={onClose} className="btn-ghost w-full">
                  {product.customizationEnabled ? `Floquer et voir le détail (+${formatPrice(product.customizationPrice)})` : "Voir la fiche complète"}
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
