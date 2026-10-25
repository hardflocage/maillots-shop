import "server-only";
import type Stripe from "stripe";
import { z } from "zod";
import { prisma } from "./prisma";
import { getStripe } from "./stripe";
import { buildQuote, cartInputSchema } from "./quote";
import { createPendingOrder, expireStaleOrders, OutOfStockError, releaseOrder, RESERVATION_MINUTES } from "./orders";
import { siteUrl } from "./settings";

export const checkoutSchema = cartInputSchema.extend({
  checkoutToken: z.string().uuid(),
  email: z.string().trim().toLowerCase().email().max(200),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  phone: z.string().trim().max(30).optional().default(""),
  line1: z.string().trim().min(3).max(120),
  line2: z.string().trim().max(120).optional().default(""),
  postalCode: z.string().trim().min(3).max(12),
  city: z.string().trim().min(1).max(80),
  country: z.string().trim().length(2),
  relayPoint: z.string().trim().max(200).optional().default(""),
  shippingMethodId: z.string().min(1).max(40),
  acceptTerms: z.literal(true),
  marketingConsent: z.boolean().default(false),
});

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; status: number; error: string };

function absolute(url: string | null) {
  if (!url) return undefined;
  const full = url.startsWith("http") ? url : `${siteUrl()}${url}`;
  // Stripe n'affiche que des images HTTPS publiques (pas de SVG)
  return full.startsWith("https://") && !full.endsWith(".svg") ? [full] : undefined;
}

export async function startCheckout(input: z.infer<typeof checkoutSchema>, userId: string | null): Promise<CheckoutResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, status: 503, error: "Le paiement en ligne n'est pas encore activé sur la boutique (clé Stripe manquante). Aucune commande n'a été créée." };
  }

  // Double clic / rechargement : on renvoie la même session de paiement au lieu d'en créer une seconde
  const existing = await prisma.order.findUnique({ where: { checkoutToken: input.checkoutToken } });
  if (existing) {
    if (existing.status === "PENDING" && existing.stripeSessionId) {
      const s = await stripe.checkout.sessions.retrieve(existing.stripeSessionId);
      if (s.status === "open" && s.url) return { ok: true, url: s.url };
    }
    return { ok: false, status: 409, error: "Cette tentative de paiement est terminée. Recharge la page pour recommencer." };
  }

  await expireStaleOrders();

  const { quote, promo, shippingMethod, products } = await buildQuote(input);
  if (quote.hasErrors) return { ok: false, status: 409, error: quote.lines.find((l) => l.error)?.error ?? "Ton panier est vide." };
  if (!shippingMethod || shippingMethod.id !== input.shippingMethodId) return { ok: false, status: 409, error: "Mode de livraison indisponible." };
  if (shippingMethod.type === "RELAY" && !input.relayPoint) return { ok: false, status: 400, error: "Indique le point relais choisi." };

  const discountLabel = [quote.autoDiscountLabel, quote.promoCode ? `Code ${quote.promoCode}` : null].filter(Boolean).join(" + ") || null;

  let order;
  try {
    order = await createPendingOrder({
      userId,
      checkoutToken: input.checkoutToken,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone || null,
      line1: input.line1,
      line2: input.line2 || null,
      postalCode: input.postalCode,
      city: input.city,
      country: input.country.toUpperCase(),
      relayPoint: shippingMethod.type === "RELAY" ? input.relayPoint : null,
      shippingMethodId: shippingMethod.id,
      shippingMethodName: shippingMethod.name,
      shippingCost: quote.shipping,
      subtotal: quote.subtotal,
      discountTotal: quote.discountTotal,
      discountLabel,
      total: quote.total,
      promoCodeId: promo?.id ?? null,
      marketingConsent: input.marketingConsent,
      items: quote.lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        productName: l.name,
        size: l.size,
        imageUrl: l.image,
        unitPrice: l.unitPrice,
        customizationName: l.customization?.name ?? null,
        customizationNumber: l.customization?.number ?? null,
        customizationPrice: l.customizationPrice,
        quantity: l.quantity,
      })),
    });
  } catch (e) {
    if (e instanceof OutOfStockError) return { ok: false, status: 409, error: e.message };
    throw e;
  }

  try {
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    if (quote.discountTotal > 0) {
      const coupon = await stripe.coupons.create(
        { amount_off: quote.discountTotal, currency: "eur", duration: "once", max_redemptions: 1, name: (discountLabel ?? "Réduction").slice(0, 40) },
        { idempotencyKey: `coupon-${order.id}` },
      );
      discounts = [{ coupon: coupon.id }];
    }
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        locale: "fr",
        customer_email: input.email,
        client_reference_id: order.id,
        metadata: { orderId: order.id, orderNumber: order.number },
        payment_intent_data: { metadata: { orderId: order.id, orderNumber: order.number } },
        line_items: quote.lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: "eur",
            unit_amount: l.unitPrice + l.customizationPrice,
            product_data: {
              name: l.name,
              description: `Taille ${l.size}${l.customization ? ` · Flocage ${l.customization.name} ${l.customization.number}` : " · Sans flocage"}`,
              images: absolute(l.image),
              metadata: { productId: l.productId, variantId: l.variantId, demo: String(products.get(l.productId)?.isDemo ?? false) },
            },
          },
        })),
        shipping_options: [
          { shipping_rate_data: { type: "fixed_amount", display_name: shippingMethod.name, fixed_amount: { amount: quote.shipping, currency: "eur" } } },
        ],
        discounts,
        expires_at: Math.floor(Date.now() / 1000) + RESERVATION_MINUTES * 60 + 60,
        success_url: `${siteUrl()}/commande/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl()}/commande?annule=${encodeURIComponent(order.number)}&t=${input.checkoutToken}`,
      },
      { idempotencyKey: `session-${order.id}` },
    );
    await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
    if (!session.url) throw new Error("Session Stripe sans URL");
    return { ok: true, url: session.url };
  } catch (e) {
    console.error("[checkout] échec de création de la session Stripe", e);
    await releaseOrder(order.id, "CANCELLED", "Échec de création du paiement Stripe : stock libéré.");
    return { ok: false, status: 502, error: "Le service de paiement est momentanément indisponible. Réessaie dans un instant." };
  }
}

/** Le client revient de Stripe sans payer : on ferme la session et on libère le stock tout de suite. */
export async function cancelCheckout(checkoutToken: string) {
  const order = await prisma.order.findUnique({ where: { checkoutToken } });
  if (!order || order.status !== "PENDING") return false;
  const stripe = getStripe();
  if (stripe && order.stripeSessionId) {
    try {
      const s = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
      if (s.status === "complete") return false; // payé entre-temps : ne rien libérer
      if (s.status === "open") await stripe.checkout.sessions.expire(order.stripeSessionId);
    } catch (e) {
      console.error("[checkout] annulation", e);
      return false;
    }
  }
  return releaseOrder(order.id, "CANCELLED", "Paiement abandonné par le client : stock libéré.");
}
