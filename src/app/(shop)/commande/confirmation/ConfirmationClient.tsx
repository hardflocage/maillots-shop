"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";

/** Vide le panier une fois le paiement confirmé ; rafraîchit la page tant qu'il est en attente. */
export function ConfirmationClient({ paid, pending }: { paid: boolean; pending: boolean }) {
  const { clear, ready, setPromoCode } = useCart();
  const router = useRouter();
  useEffect(() => {
    if (paid && ready) {
      clear();
      setPromoCode("");
    }
  }, [paid, ready, clear, setPromoCode]);
  useEffect(() => {
    if (!pending) return;
    let n = 0;
    const t = setInterval(() => {
      if (++n > 20) return clearInterval(t);
      router.refresh();
    }, 3000);
    return () => clearInterval(t);
  }, [pending, router]);
  return null;
}
