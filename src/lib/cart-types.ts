/** Ligne de panier stockée chez le client (le serveur revalide TOUJOURS prix et stock). */
export type CartCustomization = { name: string; number: number; playerId?: string | null };

export type CartLine = {
  key: string;
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  size: string;
  image: string | null;
  unitPrice: number;
  customizationPrice: number;
  quantity: number;
  customization: CartCustomization | null;
};

export function lineKey(variantId: string, c: CartCustomization | null) {
  return c ? `${variantId}|${c.name}|${c.number}` : variantId;
}

export type QuoteLine = {
  key: string;
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  size: string;
  image: string | null;
  unitPrice: number;
  customizationPrice: number;
  quantity: number;
  available: number;
  customization: CartCustomization | null;
  error: string | null;
};

export type Quote = {
  lines: QuoteLine[];
  subtotal: number;
  itemCount: number;
  autoDiscount: number;
  autoDiscountLabel: string | null;
  promoDiscount: number;
  promoCode: string | null;
  promoError: string | null;
  discountTotal: number;
  shipping: number;
  shippingMethodId: string | null;
  freeShippingRemaining: number | null;
  total: number;
  hasErrors: boolean;
};
