"use client";

import Link from "next/link";
import { useEffect } from "react";
import { formatPrice } from "@/lib/format";
import { IconClose, IconBag } from "@/components/ui/Icons";
import { useCart } from "./CartProvider";
import { useQuote } from "./useQuote";
import { CartLineItem } from "./CartLineItem";

export function CartDrawer() {
  const { lines, drawerOpen, closeDrawer, count } = useCart();
  const { quote, loading } = useQuote();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <div className={`fixed inset-0 z-[55] ${drawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
      <div className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`} onClick={closeDrawer} />
      <aside className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-ink-900 shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`} role="dialog" aria-label="Panier">
        <div className="flex h-16 items-center justify-between border-b border-ink-600 px-5">
          <p className="font-display text-2xl uppercase tracking-wide">Panier <span className="text-bone-dim">({count})</span></p>
          <button className="-mr-2 p-2" onClick={closeDrawer} aria-label="Fermer le panier"><IconClose /></button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <IconBag width={40} height={40} className="text-bone-dim" />
            <p className="text-bone-muted">Ton panier est vide.</p>
            <Link href="/boutique" onClick={closeDrawer} className="btn-primary">Découvrir les maillots</Link>
          </div>
        ) : (
          <>
            {quote?.freeShippingRemaining != null && quote.freeShippingRemaining > 0 && (
              <div className="border-b border-ink-600 px-5 py-3 text-sm text-bone-muted">
                Plus que <span className="font-semibold text-gold">{formatPrice(quote.freeShippingRemaining)}</span> pour la livraison offerte.
              </div>
            )}
            <div className="flex-1 divide-y divide-ink-600 overflow-y-auto px-5">
              {lines.map((l) => (
                <CartLineItem key={l.key} line={l} server={quote?.lines.find((q) => q.key === l.key)} compact />
              ))}
            </div>
            <div className="safe-bottom border-t border-ink-600 px-5 pt-4">
              {quote && quote.discountTotal > 0 && (
                <div className="mb-1 flex justify-between text-sm text-pitch"><span>Réductions</span><span>−{formatPrice(quote.discountTotal)}</span></div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-bone-muted">Sous-total</span>
                <span className={`text-xl font-semibold ${loading ? "opacity-50" : ""}`}>{quote ? formatPrice(quote.subtotal - quote.discountTotal) : "…"}</span>
              </div>
              <p className="mt-1 text-xs text-bone-dim">Livraison calculée à l&apos;étape suivante.</p>
              <div className="mt-4 grid gap-2">
                <Link href="/commande" onClick={closeDrawer} className={`btn-primary w-full ${quote?.hasErrors ? "pointer-events-none opacity-50" : ""}`} aria-disabled={quote?.hasErrors}>Commander</Link>
                <Link href="/panier" onClick={closeDrawer} className="btn-ghost w-full">Voir le panier</Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
