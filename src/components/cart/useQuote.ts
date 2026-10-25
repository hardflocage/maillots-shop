"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/cart-types";
import { useCart } from "./CartProvider";

/** Demande au serveur le calcul réel du panier (prix, stock, remises, livraison). */
export function useQuote(shippingMethodId?: string | null) {
  const { lines, ready, promoCode } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = JSON.stringify({
    lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity, customization: l.customization })),
    promoCode: promoCode || null,
    shippingMethodId: shippingMethodId ?? null,
  });

  useEffect(() => {
    if (!ready) return;
    if (lines.length === 0) {
      setQuote(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? "Erreur de calcul du panier");
        return r.json();
      })
      .then((q: Quote) => {
        setQuote(q);
        setError(null);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, ready]);

  return { quote, loading, error };
}
