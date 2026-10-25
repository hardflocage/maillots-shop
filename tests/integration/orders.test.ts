/**
 * Tests d'intégration sur une VRAIE base PostgreSQL (TEST_DATABASE_URL) :
 * stock par taille, réservation atomique, validation du paiement, doublons, remboursements.
 */
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { buildQuote } from "@/lib/quote";
import { createPendingOrder, expireStaleOrders, markOrderPaid, OutOfStockError, releaseOrder } from "@/lib/orders";
import { handleStripeEvent } from "@/lib/stripe-events";

let productId: string;
let sizeM: string;
let sizeL: string;

async function reset() {
  await prisma.orderEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.player.deleteMany();
  await prisma.product.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.shippingMethod.deleteMany();
  await prisma.autoDiscount.deleteMany();
  await prisma.shopSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  const p = await prisma.product.create({
    data: {
      slug: "real-test", name: "Real Madrid Test", club: "Real Madrid", season: "2025/26", price: 8990, customizationPrice: 1500,
      variants: { create: [{ size: "M", stock: 5, sortOrder: 0 }, { size: "L", stock: 3, sortOrder: 1 }, { size: "XL", stock: 0, sortOrder: 2 }] },
    },
    include: { variants: true },
  });
  productId = p.id;
  sizeM = p.variants.find((v) => v.size === "M")!.id;
  sizeL = p.variants.find((v) => v.size === "L")!.id;
  await prisma.shippingMethod.create({ data: { name: "Domicile", price: 490, freeOver: 10000 } });
}

const stock = async (id: string) => (await prisma.variant.findUniqueOrThrow({ where: { id } })).stock;

function orderInput(variantId: string, quantity: number, extra: Partial<Parameters<typeof createPendingOrder>[0]> = {}) {
  return {
    email: "client@test.fr", firstName: "Jean", lastName: "Test", line1: "1 rue du Stade", postalCode: "75001", city: "Paris",
    shippingMethodName: "Domicile", shippingCost: 490, subtotal: 8990 * quantity, total: 8990 * quantity + 490,
    items: [{ productId, variantId, productName: "Real Madrid Test", size: "M", unitPrice: 8990, quantity }],
    ...extra,
  };
}

function sessionEvent(type: string, orderId: string, extra: Partial<Stripe.Checkout.Session> = {}, id = `evt_${Math.random()}`) {
  return { id, type, data: { object: { id: `cs_${orderId}`, metadata: { orderId }, payment_status: "paid", payment_intent: `pi_${orderId}`, amount_total: 9480, ...extra } } } as unknown as Stripe.Event;
}

beforeAll(() => {
  if (!process.env.DATABASE_URL?.includes("test")) throw new Error("Lancez ces tests sur une base de test (DATABASE_URL doit contenir 'test').");
});
beforeEach(reset);
afterAll(() => prisma.$disconnect());

describe("panier recalculé côté serveur", () => {
  it("utilise le prix en base et refuse une taille épuisée", async () => {
    const xl = (await prisma.variant.findFirstOrThrow({ where: { productId, size: "XL" } })).id;
    const { quote } = await buildQuote({ lines: [{ productId, variantId: sizeM, quantity: 1 }, { productId, variantId: xl, quantity: 1 }] });
    expect(quote.lines[0].unitPrice).toBe(8990);
    expect(quote.lines[0].error).toBeNull();
    expect(quote.lines[1].error).toMatch(/Rupture/);
    expect(quote.hasErrors).toBe(true);
  });

  it("refuse plus que le stock disponible, même réparti sur plusieurs lignes", async () => {
    const { quote } = await buildQuote({ lines: [
      { productId, variantId: sizeL, quantity: 2 },
      { productId, variantId: sizeL, quantity: 2, customization: { name: "Mbappé", number: 9 } },
    ] });
    expect(quote.lines.every((l) => l.error?.includes("Plus que 3"))).toBe(true);
  });

  it("ajoute le supplément flocage et refuse le flocage si désactivé", async () => {
    let { quote } = await buildQuote({ lines: [{ productId, variantId: sizeM, quantity: 1, customization: { name: "zidane", number: 10 } }] });
    expect(quote.lines[0].customization).toEqual({ name: "ZIDANE", number: 10, playerId: null });
    expect(quote.subtotal).toBe(8990 + 1500);
    expect(quote.shipping).toBe(0); // 104,90 € ≥ seuil de 100 €
    await prisma.product.update({ where: { id: productId }, data: { customizationEnabled: false } });
    ({ quote } = await buildQuote({ lines: [{ productId, variantId: sizeM, quantity: 1, customization: { name: "ZIDANE", number: 10 } }] }));
    expect(quote.lines[0].error).toMatch(/flocage/i);
  });

  it("valide les codes promo (expiré, limite atteinte)", async () => {
    await prisma.promoCode.create({ data: { code: "OLD", value: 10, expiresAt: new Date(Date.now() - 1000) } });
    await prisma.promoCode.create({ data: { code: "FULL", value: 10, maxUses: 1, usedCount: 1 } });
    await prisma.promoCode.create({ data: { code: "OK10", value: 10 } });
    const q = async (code: string) => (await buildQuote({ lines: [{ productId, variantId: sizeM, quantity: 1 }], promoCode: code })).quote;
    expect((await q("OLD")).promoError).toMatch(/expiré/);
    expect((await q("FULL")).promoError).toMatch(/limite/);
    const ok = await q("ok10");
    expect(ok.promoCode).toBe("OK10");
    expect(ok.promoDiscount).toBe(899);
  });
});

describe("stock par taille", () => {
  it("décrémente uniquement la taille commandée", async () => {
    await createPendingOrder(orderInput(sizeM, 2));
    expect(await stock(sizeM)).toBe(3);
    expect(await stock(sizeL)).toBe(3);
  });

  it("ne vend jamais plus que le stock, même avec des commandes simultanées", async () => {
    const attempts = await Promise.allSettled(Array.from({ length: 6 }, () => createPendingOrder(orderInput(sizeL, 1))));
    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(3);
    expect(attempts.filter((a) => a.status === "rejected" && a.reason instanceof OutOfStockError)).toHaveLength(3);
    expect(await stock(sizeL)).toBe(0);
  });

  it("libère le stock une seule fois", async () => {
    const o = await createPendingOrder(orderInput(sizeM, 2));
    expect(await releaseOrder(o.id, "EXPIRED", "test")).toBe(true);
    expect(await releaseOrder(o.id, "EXPIRED", "test")).toBe(false);
    expect(await stock(sizeM)).toBe(5);
  });

  it("libère automatiquement les réservations expirées", async () => {
    const o = await createPendingOrder(orderInput(sizeM, 1));
    await prisma.order.update({ where: { id: o.id }, data: { expiresAt: new Date(Date.now() - 10 * 60_000) } });
    expect(await expireStaleOrders()).toBe(1);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("EXPIRED");
    expect(await stock(sizeM)).toBe(5);
  });
});

describe("validation du paiement (webhook Stripe)", () => {
  it("passe la commande en PAYÉE une seule fois et compte le code promo", async () => {
    const promo = await prisma.promoCode.create({ data: { code: "P", value: 10 } });
    const o = await createPendingOrder(orderInput(sizeM, 1, { promoCodeId: promo.id, total: 9480 }));
    await handleStripeEvent(sessionEvent("checkout.session.completed", o.id));
    await handleStripeEvent(sessionEvent("checkout.session.completed", o.id));
    const paid = await prisma.order.findUniqueOrThrow({ where: { id: o.id } });
    expect(paid.status).toBe("PAID");
    expect(paid.stripePaymentIntentId).toBe(`pi_${o.id}`);
    expect((await prisma.promoCode.findUniqueOrThrow({ where: { id: promo.id } })).usedCount).toBe(1);
    expect(await stock(sizeM)).toBe(4);
  });

  it("n'accepte pas un paiement non abouti (paiement différé)", async () => {
    const o = await createPendingOrder(orderInput(sizeM, 1));
    await handleStripeEvent(sessionEvent("checkout.session.completed", o.id, { payment_status: "unpaid" }));
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("PENDING");
    await handleStripeEvent(sessionEvent("checkout.session.async_payment_failed", o.id));
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("CANCELLED");
    expect(await stock(sizeM)).toBe(5);
  });

  it("une expiration reçue après paiement ne libère pas le stock", async () => {
    const o = await createPendingOrder(orderInput(sizeM, 1));
    await markOrderPaid(o.id, "pi_x", 9480);
    await handleStripeEvent(sessionEvent("checkout.session.expired", o.id));
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("PAID");
    expect(await stock(sizeM)).toBe(4);
  });

  it("signale un écart de montant", async () => {
    const o = await createPendingOrder(orderInput(sizeM, 1));
    await markOrderPaid(o.id, "pi_y", 100);
    const events = await prisma.orderEvent.findMany({ where: { orderId: o.id } });
    expect(events.some((e) => e.message.startsWith("ATTENTION"))).toBe(true);
  });

  it("enregistre un remboursement partiel puis total", async () => {
    const o = await createPendingOrder(orderInput(sizeM, 1));
    await markOrderPaid(o.id, "pi_refund", 9480);
    const charge = (amount: number) => ({ id: `evt_${amount}`, type: "charge.refunded", data: { object: { payment_intent: "pi_refund", amount_refunded: amount } } }) as unknown as Stripe.Event;
    await handleStripeEvent(charge(2000));
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("PARTIALLY_REFUNDED");
    await handleStripeEvent(charge(2000)); // doublon : aucun effet
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).refundedAmount).toBe(2000);
    await handleStripeEvent(charge(9480));
    const done = await prisma.order.findUniqueOrThrow({ where: { id: o.id } });
    expect(done.status).toBe("REFUNDED");
    expect(done.refundedAmount).toBe(9480);
  });
});
