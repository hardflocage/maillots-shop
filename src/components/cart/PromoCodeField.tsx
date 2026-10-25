"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

export function PromoCodeField({ applied, error }: { applied: string | null; error: string | null }) {
  const { promoCode, setPromoCode } = useCart();
  const [value, setValue] = useState(promoCode);
  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-pitch/30 bg-pitch/10 px-4 py-3 text-sm">
        <span className="text-pitch">Code <strong>{applied}</strong> appliqué</span>
        <button className="text-bone-muted underline hover:text-bone" onClick={() => { setPromoCode(""); setValue(""); }}>Retirer</button>
      </div>
    );
  }
  return (
    <div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setPromoCode(value.trim().toUpperCase()); }}>
        <input className="input uppercase" placeholder="Code promo" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Code promo" autoCapitalize="characters" />
        <button className="btn-ghost shrink-0 px-5">Appliquer</button>
      </form>
      {promoCode && error && <p className="mt-2 text-sm text-signal">{error}</p>}
    </div>
  );
}
