"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { useQuote } from "@/components/cart/useQuote";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { PromoCodeField } from "@/components/cart/PromoCodeField";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { formatPrice } from "@/lib/format";
import { IconShield } from "@/components/ui/Icons";

export function CartPageClient() {
  const { lines, ready } = useCart();
  const { quote, loading, error } = useQuote();

  if (!ready) return <div className="container-x min-h-[50vh] py-16" />;

  if (lines.length === 0) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center gap-6 py-20 text-center">
        <h1 className="h-display text-5xl sm:text-7xl">Panier vide</h1>
        <p className="text-bone-muted">Trouve le maillot de tes légendes.</p>
        <Link href="/boutique" className="btn-primary">Découvrir les maillots</Link>
      </div>
    );
  }

  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="h-display mb-10 text-5xl sm:text-7xl">Panier</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-14">
        <div className="divide-y divide-ink-600 border-y border-ink-600">
          {lines.map((l) => <CartLineItem key={l.key} line={l} server={quote?.lines.find((q) => q.key === l.key)} />)}
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card space-y-5 p-6">
            <p className="font-display text-2xl uppercase">Récapitulatif</p>
            {quote?.freeShippingRemaining != null && quote.freeShippingRemaining > 0 && (
              <p className="rounded-xl bg-gold/10 px-4 py-3 text-sm text-gold">Plus que {formatPrice(quote.freeShippingRemaining)} pour la livraison offerte.</p>
            )}
            <PromoCodeField applied={quote?.promoCode ?? null} error={quote?.promoError ?? null} />
            {quote && <OrderSummary quote={quote} loading={loading} />}
            {error && <p className="text-sm text-signal">{error}</p>}
            {quote?.hasErrors && <p className="text-sm text-signal">Corrige les articles signalés pour continuer.</p>}
            <Link href="/commande" className={`btn-primary w-full py-4 ${!quote || quote.hasErrors ? "pointer-events-none opacity-50" : ""}`} aria-disabled={!quote || quote.hasErrors}>Passer commande</Link>
            <p className="flex items-center justify-center gap-2 text-xs text-bone-dim"><IconShield width={16} height={16} /> Paiement sécurisé par Stripe · Sans création de compte</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
