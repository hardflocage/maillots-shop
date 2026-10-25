import "server-only";
import { randomInt } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { escapeHtml, emailParagraph, sendAdminNotification, sendOrderConfirmation } from "./email";

/** Délai de réservation du stock pendant le paiement (Stripe impose 30 min minimum) */
export const RESERVATION_MINUTES = 30;

export class OutOfStockError extends Error {}

function orderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 5; i++) suffix += alphabet[randomInt(alphabet.length)];
  return `M${ymd}-${suffix}`;
}

/**
 * Décrémente le stock de chaque taille de façon atomique : la mise à jour n'a lieu que si
 * le stock restant est suffisant. Deux clients ne peuvent donc jamais acheter le dernier exemplaire.
 */
export async function reserveStock(tx: Prisma.TransactionClient, items: { variantId: string; quantity: number }[]) {
  const byVariant = new Map<string, number>();
  for (const i of items) byVariant.set(i.variantId, (byVariant.get(i.variantId) ?? 0) + i.quantity);
  for (const [variantId, qty] of byVariant) {
    const res = await tx.variant.updateMany({ where: { id: variantId, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
    if (res.count === 0) throw new OutOfStockError("Un article de ton panier vient de passer en rupture de stock.");
  }
}

export async function createPendingOrder(data: Omit<Prisma.OrderUncheckedCreateInput, "number" | "items"> & {
  items: Omit<Prisma.OrderItemUncheckedCreateWithoutOrderInput, "orderId">[];
}) {
  const { items, ...order } = data;
  return prisma.$transaction(async (tx) => {
    await reserveStock(tx, items.map((i) => ({ variantId: i.variantId!, quantity: i.quantity })));
    for (let attempt = 0; ; attempt++) {
      try {
        return await tx.order.create({
          data: {
            ...order,
            number: orderNumber(),
            expiresAt: new Date(Date.now() + RESERVATION_MINUTES * 60_000),
            items: { create: items },
            events: { create: { type: "created", message: "Commande créée, en attente de paiement." } },
          },
        });
      } catch (e) {
        if (attempt < 3 && (e as { code?: string }).code === "P2002") continue;
        throw e;
      }
    }
  });
}

/** Remet en stock les articles d'une commande non payée. Idempotent grâce au drapeau stockReleased. */
export async function releaseOrder(orderId: string, status: "EXPIRED" | "CANCELLED", reason: string) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({ where: { id: orderId, status: "PENDING", stockReleased: false }, data: { status, stockReleased: true } });
    if (claimed.count === 0) return false;
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const i of items) if (i.variantId) await tx.variant.update({ where: { id: i.variantId }, data: { stock: { increment: i.quantity } } });
    await tx.orderEvent.create({ data: { orderId, type: status.toLowerCase(), message: reason } });
    return true;
  });
}

/** Libère les commandes dont la réservation a expiré (filet de sécurité si un webhook est manqué). */
export async function expireStaleOrders() {
  const stale = await prisma.order.findMany({
    where: { status: "PENDING", expiresAt: { lt: new Date(Date.now() - 5 * 60_000) } },
    select: { id: true },
    take: 200,
  });
  for (const o of stale) await releaseOrder(o.id, "EXPIRED", "Paiement non finalisé dans le délai : stock libéré.");
  return stale.length;
}

/**
 * Validation définitive après confirmation de Stripe (webhook signé).
 * Ne passe à PAID qu'une seule fois, même si Stripe renvoie l'évènement plusieurs fois.
 */
export async function markOrderPaid(orderId: string, paymentIntentId: string | null, amountTotal: number | null) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return { changed: false as const };
    if (order.status !== "PENDING" && order.status !== "EXPIRED" && order.status !== "CANCELLED") return { changed: false as const };

    // Cas rare : le stock avait été libéré (expiration) mais le paiement a tout de même abouti.
    let restockIssue = false;
    if (order.stockReleased) {
      try {
        await reserveStock(tx, order.items.filter((i) => i.variantId).map((i) => ({ variantId: i.variantId!, quantity: i.quantity })));
      } catch {
        restockIssue = true;
        for (const i of order.items) if (i.variantId) await tx.variant.update({ where: { id: i.variantId }, data: { stock: { decrement: i.quantity } } });
      }
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", paidAt: new Date(), stripePaymentIntentId: paymentIntentId, stockReleased: false },
    });
    if (order.promoCodeId) await tx.promoCode.update({ where: { id: order.promoCodeId }, data: { usedCount: { increment: 1 } } });
    const msgs = [`Paiement confirmé par Stripe${amountTotal != null ? ` (${(amountTotal / 100).toFixed(2)} €)` : ""}.`];
    if (amountTotal != null && amountTotal !== order.total) msgs.push(`ATTENTION : montant payé différent du total attendu (${(order.total / 100).toFixed(2)} €). Vérifiez dans Stripe.`);
    if (restockIssue) msgs.push("ATTENTION : paiement reçu après expiration et stock insuffisant. Le stock est passé en négatif, vérifiez la disponibilité.");
    for (const m of msgs) await tx.orderEvent.create({ data: { orderId, type: "paid", message: m } });
    return { changed: true as const, warning: msgs.length > 1 };
  });

  if (result.changed) {
    await sendOrderConfirmation(orderId);
    await notifyNewOrderAndLowStock(orderId);
  }
  return result.changed;
}

async function notifyNewOrderAndLowStock(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { variant: { include: { product: { select: { name: true } } } } } } },
  });
  if (!order) return;
  const lines = order.items.map((i) => `${escapeHtml(i.productName)} — ${escapeHtml(i.size)} × ${i.quantity}${i.customizationName ? ` (flocage ${escapeHtml(i.customizationName)} ${i.customizationNumber})` : ""}`);
  const low = order.items
    .filter((i) => i.variant && i.variant.stock <= i.variant.lowStockThreshold)
    .map((i) => `${escapeHtml(i.variant!.product.name)} taille ${escapeHtml(i.variant!.size)} : ${i.variant!.stock} restant(s)`);
  let body = emailParagraph(`Nouvelle commande <strong>${order.number}</strong> (${(order.total / 100).toFixed(2)} €)<br>${lines.join("<br>")}`);
  if (low.length) body += emailParagraph(`<strong>Alerte stock bas :</strong><br>${low.join("<br>")}`);
  await sendAdminNotification(`Nouvelle commande ${order.number}${low.length ? " · stock bas" : ""}`, body);
}
