/**
 * Calculs de prix PURS (sans base de données) : utilisés côté serveur pour le panier,
 * la commande et Stripe. Tous les montants sont en centimes.
 */

export type PricedLine = { unitPrice: number; customizationPrice: number; quantity: number };

export type PromoRule = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotal: number | null;
};

export type AutoDiscountRule = { name: string; minQuantity: number; percentOff: number };

export type ShippingRule = { price: number; freeOver: number | null };

export type Totals = {
  subtotal: number;
  itemCount: number;
  autoDiscount: number;
  autoDiscountLabel: string | null;
  promoDiscount: number;
  promoError: string | null;
  discountTotal: number;
  shipping: number;
  freeShippingRemaining: number | null;
  total: number;
};

export function lineTotal(l: PricedLine) {
  return (l.unitPrice + l.customizationPrice) * l.quantity;
}

/** Meilleure remise automatique applicable selon le nombre d'articles */
export function bestAutoDiscount(itemCount: number, rules: AutoDiscountRule[]) {
  return rules
    .filter((r) => itemCount >= r.minQuantity && r.percentOff > 0 && r.percentOff < 100)
    .sort((a, b) => b.percentOff - a.percentOff)[0] ?? null;
}

export function computeTotals(input: {
  lines: PricedLine[];
  autoDiscounts?: AutoDiscountRule[];
  promo?: PromoRule | null;
  shipping?: ShippingRule | null;
}): Totals {
  const subtotal = input.lines.reduce((s, l) => s + lineTotal(l), 0);
  const itemCount = input.lines.reduce((s, l) => s + l.quantity, 0);

  const auto = bestAutoDiscount(itemCount, input.autoDiscounts ?? []);
  const autoDiscount = auto ? Math.round((subtotal * auto.percentOff) / 100) : 0;
  const afterAuto = subtotal - autoDiscount;

  let promoDiscount = 0;
  let promoError: string | null = null;
  const promo = input.promo;
  if (promo) {
    if (promo.minSubtotal && subtotal < promo.minSubtotal) {
      promoError = `Ce code nécessite un panier d'au moins ${(promo.minSubtotal / 100).toFixed(2).replace(".", ",")} €.`;
    } else if (promo.type === "PERCENT") {
      promoDiscount = Math.round((afterAuto * Math.min(Math.max(promo.value, 0), 100)) / 100);
    } else {
      promoDiscount = Math.min(Math.max(promo.value, 0), afterAuto);
    }
  }

  const discountTotal = autoDiscount + promoDiscount;
  const merchandise = subtotal - discountTotal;

  let shipping = 0;
  let freeShippingRemaining: number | null = null;
  if (input.shipping && itemCount > 0) {
    const { price, freeOver } = input.shipping;
    if (freeOver != null && merchandise >= freeOver) shipping = 0;
    else {
      shipping = price;
      if (freeOver != null) freeShippingRemaining = freeOver - merchandise;
    }
  }

  return {
    subtotal,
    itemCount,
    autoDiscount,
    autoDiscountLabel: auto ? `${auto.name} (-${auto.percentOff} %)` : null,
    promoDiscount,
    promoError,
    discountTotal,
    shipping,
    freeShippingRemaining,
    total: merchandise + shipping,
  };
}

/** Validation du texte de flocage : lettres (accents inclus), espaces, tirets, apostrophes. */
export function sanitizeFlockingName(name: string, maxLength: number) {
  const cleaned = name.normalize("NFC").toUpperCase().replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) return { ok: false as const, error: "Saisis un nom pour le flocage." };
  if (cleaned.length > maxLength) return { ok: false as const, error: `${maxLength} caractères maximum.` };
  if (!/^[A-ZÀ-ÖØ-Þ' .-]+$/u.test(cleaned)) return { ok: false as const, error: "Lettres, espaces, points, tirets et apostrophes uniquement." };
  return { ok: true as const, value: cleaned };
}

export function validFlockingNumber(n: unknown) {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 99;
}
