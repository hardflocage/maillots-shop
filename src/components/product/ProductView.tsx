"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { sanitizeFlockingName } from "@/lib/pricing";
import { useCart } from "@/components/cart/CartProvider";
import { IconCheck, IconMinus, IconPlus, IconTruck } from "@/components/ui/Icons";
import { ProductGallery, type GalleryImage } from "./ProductGallery";
import { FavoriteButton } from "./FavoriteButton";
import { ShareButtons } from "./ShareButtons";
import { SizeGuideButton } from "./SizeGuide";

export type ProductViewData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  customizationEnabled: boolean;
  customizationPrice: number;
  maxNameLength: number;
  flockingColor: string;
  flockingTop: number;
  deliveryInfo: string | null;
  images: GalleryImage[];
  variants: { id: string; size: string; stock: number; lowStockThreshold: number }[];
  players: { id: string; name: string; number: number }[];
};

export function ProductView({ product, isFavorite, loggedIn, header, shippingNote, sizeGuideHtml }: { product: ProductViewData; isFavorite: boolean; loggedIn: boolean; header: React.ReactNode; shippingNote: string | null; sizeGuideHtml: string | null }) {
  const { add } = useCart();
  const [active, setActive] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [withFlocking, setWithFlocking] = useState(false);
  const [playerId, setPlayerId] = useState<string>("");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [qty, setQty] = useState(1);
  const [touched, setTouched] = useState(false);
  const [added, setAdded] = useState(false);
  const sizeRef = useRef<HTMLDivElement>(null);
  const flockRef = useRef<HTMLDivElement>(null);

  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const backIndex = product.images.findIndex((i) => i.kind === "BACK");
  const allSoldOut = product.variants.every((v) => v.stock <= 0);

  const nameCheck = useMemo(() => sanitizeFlockingName(name, product.maxNameLength), [name, product.maxNameLength]);
  const numberValue = number === "" ? NaN : Number(number);
  const numberOk = Number.isInteger(numberValue) && numberValue >= 0 && numberValue <= 99;
  const flockingOk = !withFlocking || (nameCheck.ok && numberOk);
  const unit = product.price + (withFlocking ? product.customizationPrice : 0);
  const maxQty = variant ? Math.min(variant.stock, 20) : 20;

  const preview = withFlocking && (name || number)
    ? { name: nameCheck.ok ? nameCheck.value : name.toUpperCase(), number: number, color: product.flockingColor, top: product.flockingTop }
    : null;

  const showBack = () => backIndex !== -1 && setActive(backIndex);

  const choosePlayer = (id: string) => {
    setPlayerId(id);
    const p = product.players.find((x) => x.id === id);
    if (p) {
      setName(p.name);
      setNumber(String(p.number));
      showBack();
    }
  };

  const submit = () => {
    setTouched(true);
    // sur mobile, le bouton est fixé en bas : on amène le client vers le champ à corriger
    if (!variant || variant.stock <= 0) return sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (!flockingOk) return flockRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    add({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      size: variant.size,
      image: product.images.find((i) => i.kind === "FRONT")?.url ?? product.images[0]?.url ?? null,
      unitPrice: product.price,
      customizationPrice: withFlocking ? product.customizationPrice : 0,
      quantity: Math.min(qty, maxQty),
      customization: withFlocking && nameCheck.ok ? { name: nameCheck.value, number: numberValue, playerId: playerId || null } : null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const cta = allSoldOut ? "Rupture de stock" : !variant ? "Choisis ta taille" : `Ajouter au panier · ${formatPrice(unit * qty)}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
      <ProductGallery images={product.images} active={active} onChange={setActive} preview={preview} />

      <div className="pb-28 lg:pb-0">
        {header}

        <div className="mt-5 flex items-baseline gap-3">
          <span className={`text-3xl font-semibold ${product.compareAtPrice && product.compareAtPrice > product.price ? "text-signal" : ""}`}>{formatPrice(product.price)}</span>
          {product.compareAtPrice != null && product.compareAtPrice > product.price && (
            <>
              <span className="text-lg text-bone-dim line-through">{formatPrice(product.compareAtPrice)}</span>
              <span className="rounded-full bg-signal/15 px-2.5 py-1 text-xs font-bold text-signal">−{Math.round((1 - product.price / product.compareAtPrice) * 100)} %</span>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-bone-dim">TTC, hors frais de livraison</p>

        {/* TAILLES */}
        <div className="mt-8 scroll-mt-24" ref={sizeRef}>
          <div className="mb-3 flex items-center justify-between">
            <p className="label mb-0">Taille {variant && <span className="ml-1 normal-case tracking-normal text-bone">: {variant.size}</span>}</p>
            {sizeGuideHtml ? <SizeGuideButton html={sizeGuideHtml} /> : <Link href="/guide-des-tailles" className="text-xs text-bone-muted underline underline-offset-4 hover:text-bone">Guide des tailles</Link>}
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Choix de la taille">
            {product.variants.map((v) => {
              const out = v.stock <= 0;
              const sel = v.id === variantId;
              return (
                <button
                  key={v.id}
                  role="radio"
                  aria-checked={sel}
                  disabled={out}
                  onClick={() => { setVariantId(v.id); setQty((q) => Math.min(q, v.stock)); }}
                  className={`relative h-12 rounded-xl border text-sm font-semibold transition ${sel ? "border-bone bg-bone text-ink" : out ? "cursor-not-allowed border-ink-600 text-bone-dim line-through" : "border-ink-500 text-bone hover:border-bone/60"}`}
                  title={out ? "Rupture de stock" : undefined}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
          {touched && !variant && !allSoldOut && <p className="mt-2 text-sm text-signal">Sélectionne une taille.</p>}
          {variant && variant.stock > 0 && variant.stock <= variant.lowStockThreshold && <p className="mt-2 text-sm text-gold">Plus que {variant.stock} en stock dans cette taille.</p>}
          {allSoldOut && <p className="mt-3 rounded-xl bg-ink-700 px-4 py-3 text-sm text-bone-muted">Ce maillot est en rupture de stock dans toutes les tailles.</p>}
        </div>

        {/* FLOCAGE */}
        {product.customizationEnabled && (
          <div className="mt-8">
            <p className="label">Personnalisation</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Flocage">
              <button role="radio" aria-checked={!withFlocking} onClick={() => setWithFlocking(false)} className={`rounded-xl border px-4 py-3.5 text-left text-sm transition ${!withFlocking ? "border-bone bg-white/5" : "border-ink-500 hover:border-bone/50"}`}>
                <span className="block font-semibold">Sans flocage</span>
                <span className="text-bone-dim">Inclus</span>
              </button>
              <button role="radio" aria-checked={withFlocking} onClick={() => { setWithFlocking(true); showBack(); }} className={`rounded-xl border px-4 py-3.5 text-left text-sm transition ${withFlocking ? "border-gold bg-gold/10" : "border-ink-500 hover:border-bone/50"}`}>
                <span className="block font-semibold">Avec flocage</span>
                <span className="text-gold">+{formatPrice(product.customizationPrice)}</span>
              </button>
            </div>

            {withFlocking && (
              <div ref={flockRef} className="mt-4 animate-fade-in space-y-4 rounded-2xl border border-ink-600 bg-ink-800 p-4 sm:p-5">
                {product.players.length > 0 && (
                  <div>
                    <label className="label" htmlFor="player">Joueur</label>
                    <select id="player" className="input" value={playerId} onChange={(e) => (e.target.value ? choosePlayer(e.target.value) : setPlayerId(""))}>
                      <option value="">Personnalisé (mon nom)</option>
                      {product.players.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.number}</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-[1fr_96px] gap-3">
                  <div>
                    <label className="label" htmlFor="fname">Nom</label>
                    <input id="fname" className="input uppercase" value={name} maxLength={product.maxNameLength} onChange={(e) => { setName(e.target.value); setPlayerId(""); }} onFocus={showBack} placeholder="TON NOM" autoComplete="off" autoCapitalize="characters" />
                  </div>
                  <div>
                    <label className="label" htmlFor="fnum">Numéro</label>
                    <input id="fnum" className="input text-center" value={number} inputMode="numeric" maxLength={2} onChange={(e) => { setNumber(e.target.value.replace(/\D/g, "").slice(0, 2)); setPlayerId(""); }} onFocus={showBack} placeholder="10" />
                  </div>
                </div>
                <p className="text-xs text-bone-dim">{name.length}/{product.maxNameLength} caractères · numéro de 0 à 99</p>
                {touched && !nameCheck.ok && <p className="text-sm text-signal">{nameCheck.error}</p>}
                {touched && !numberOk && <p className="text-sm text-signal">Saisis un numéro entre 0 et 99.</p>}
                <p className="text-xs leading-relaxed text-bone-muted">L&apos;aperçu sur la photo de dos est une <strong className="text-bone">simulation</strong> pour vérifier ton texte. Le flocage final suit la police et le placement officiels du maillot. Les articles personnalisés ne sont ni repris ni échangés (sauf défaut).</p>
              </div>
            )}
          </div>
        )}

        {/* QUANTITÉ + RÉCAP */}
        <div className="mt-8 flex items-center gap-4">
          <div className="flex items-center rounded-full border border-ink-500">
            <button className="p-3.5 text-bone-muted hover:text-bone disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Diminuer"><IconMinus width={16} height={16} /></button>
            <span className="w-8 text-center tabular-nums">{qty}</span>
            <button className="p-3.5 text-bone-muted hover:text-bone disabled:opacity-30" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Augmenter"><IconPlus width={16} height={16} /></button>
          </div>
          {withFlocking && nameCheck.ok && numberOk && (
            <p className="text-sm text-bone-muted">Maillot {formatPrice(product.price)} + flocage {formatPrice(product.customizationPrice)}</p>
          )}
        </div>

        <div className="mt-6 hidden gap-3 lg:flex">
          <button onClick={submit} disabled={allSoldOut} className="btn-primary flex-1 py-[18px] text-[13px]">
            {added ? <><IconCheck width={18} height={18} /> Ajouté au panier</> : cta}
          </button>
          <FavoriteButton productId={product.id} initial={isFavorite} loggedIn={loggedIn} />
        </div>

        <div className="mt-8 space-y-3 border-t border-ink-600 pt-6 text-sm text-bone-muted">
          <p className="flex items-start gap-3"><IconTruck width={20} height={20} className="mt-0.5 shrink-0 text-gold" /> <span>{product.deliveryInfo || shippingNote || "Modes et frais de livraison présentés avant le paiement."}</span></p>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <ShareButtons title={product.name} />
          <span className="lg:hidden"><FavoriteButton productId={product.id} initial={isFavorite} loggedIn={loggedIn} /></span>
        </div>
      </div>

      {/* Barre d'achat fixe (mobile) */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink-600 bg-ink/95 px-4 pt-3 backdrop-blur-xl lg:hidden">
        <button onClick={submit} disabled={allSoldOut} className="btn-primary w-full py-4 text-[13px]">
          {added ? <><IconCheck width={18} height={18} /> Ajouté au panier</> : cta}
        </button>
      </div>
    </div>
  );
}
