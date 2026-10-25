import "server-only";
import { z } from "zod";
import { prisma } from "./prisma";
import { computeTotals, sanitizeFlockingName, validFlockingNumber } from "./pricing";
import { lineKey, type Quote, type QuoteLine } from "./cart-types";
import { primaryImage } from "./products";

export const cartInputSchema = z.object({
  lines: z
    .array(
      z.object({
        productId: z.string().min(1).max(40),
        variantId: z.string().min(1).max(40),
        quantity: z.number().int().min(1).max(20),
        customization: z
          .object({ name: z.string().max(30), number: z.number().int(), playerId: z.string().max(40).nullish() })
          .nullish(),
      }),
    )
    .max(50),
  promoCode: z.string().trim().max(40).nullish(),
  shippingMethodId: z.string().max(40).nullish(),
});

export type CartInput = z.infer<typeof cartInputSchema>;

/** Vérifie un code promo en base. */
export async function findValidPromo(code: string | null | undefined) {
  if (!code) return { promo: null, error: null };
  const promo = await prisma.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  const now = new Date();
  if (!promo || !promo.isActive) return { promo: null, error: "Code promo invalide." };
  if (promo.startsAt && promo.startsAt > now) return { promo: null, error: "Ce code n'est pas encore actif." };
  if (promo.expiresAt && promo.expiresAt < now) return { promo: null, error: "Ce code a expiré." };
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return { promo: null, error: "Ce code a atteint sa limite d'utilisation." };
  return { promo, error: null };
}

/**
 * Recalcule entièrement le panier à partir de la base : prix réels, stock réel,
 * flocage autorisé ou non, remises et livraison. Le client ne fixe jamais un prix.
 */
export async function buildQuote(input: CartInput) {
  const productIds = [...new Set(input.lines.map((l) => l.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true, images: { orderBy: { sortOrder: "asc" } }, players: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  // quantités demandées par variante (plusieurs lignes peuvent viser la même taille)
  const requestedByVariant = new Map<string, number>();
  for (const l of input.lines) requestedByVariant.set(l.variantId, (requestedByVariant.get(l.variantId) ?? 0) + l.quantity);

  const lines: QuoteLine[] = input.lines.map((l) => {
    const p = byId.get(l.productId);
    const v = p?.variants.find((x) => x.id === l.variantId);
    const base = {
      productId: l.productId,
      variantId: l.variantId,
      quantity: l.quantity,
      customization: null as QuoteLine["customization"],
    };
    if (!p || !v || !p.isActive) {
      return { ...base, key: lineKey(l.variantId, null), slug: p?.slug ?? "", name: p?.name ?? "Produit indisponible", size: v?.size ?? "", image: null, unitPrice: 0, customizationPrice: 0, available: 0, error: "Ce produit n'est plus disponible." };
    }
    let error: string | null = null;
    let customization: QuoteLine["customization"] = null;
    let customizationPrice = 0;
    if (l.customization) {
      if (!p.customizationEnabled) error = "Le flocage n'est plus proposé pour ce maillot.";
      else {
        const name = sanitizeFlockingName(l.customization.name, p.maxNameLength);
        if (!name.ok) error = `Flocage : ${name.error}`;
        else if (!validFlockingNumber(l.customization.number)) error = "Flocage : numéro entre 0 et 99.";
        else {
          const player = l.customization.playerId ? p.players.find((x) => x.id === l.customization!.playerId) : null;
          customization = { name: name.value, number: l.customization.number, playerId: player?.id ?? null };
          customizationPrice = p.customizationPrice;
        }
      }
    }
    const requested = requestedByVariant.get(v.id) ?? 0;
    if (!error && v.stock <= 0) error = "Rupture de stock pour cette taille.";
    else if (!error && requested > v.stock) error = `Plus que ${v.stock} en stock pour la taille ${v.size}.`;
    return {
      ...base,
      key: lineKey(v.id, customization),
      slug: p.slug,
      name: p.name,
      size: v.size,
      image: primaryImage(p.images),
      unitPrice: p.price,
      customizationPrice,
      customization,
      available: v.stock,
      error,
    };
  });

  const [autoDiscounts, promoResult, shippingMethod] = await Promise.all([
    prisma.autoDiscount.findMany({ where: { isActive: true } }),
    findValidPromo(input.promoCode),
    input.shippingMethodId
      ? prisma.shippingMethod.findFirst({ where: { id: input.shippingMethodId, isActive: true } })
      : prisma.shippingMethod.findFirst({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const valid = lines.filter((l) => !l.error);
  const totals = computeTotals({
    lines: valid,
    autoDiscounts,
    promo: promoResult.promo,
    shipping: shippingMethod,
  });

  const quote: Quote = {
    lines,
    subtotal: totals.subtotal,
    itemCount: totals.itemCount,
    autoDiscount: totals.autoDiscount,
    autoDiscountLabel: totals.autoDiscountLabel,
    promoDiscount: totals.promoDiscount,
    promoCode: promoResult.promo && !totals.promoError ? promoResult.promo.code : null,
    promoError: promoResult.error ?? totals.promoError,
    discountTotal: totals.discountTotal,
    shipping: totals.shipping,
    shippingMethodId: shippingMethod?.id ?? null,
    freeShippingRemaining: totals.freeShippingRemaining,
    total: totals.total,
    hasErrors: lines.some((l) => l.error) || lines.length === 0,
  };
  return { quote, promo: quote.promoCode ? promoResult.promo : null, shippingMethod, products: byId };
}
