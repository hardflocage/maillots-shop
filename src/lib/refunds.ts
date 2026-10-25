import "server-only";
import type Stripe from "stripe";
import { prisma } from "./prisma";
import { getStripe } from "./stripe";
import { sendRefundNotification } from "./email";

/** Synchronise le montant remboursé depuis Stripe (idempotent : on recopie le cumul fourni par Stripe). */
export async function applyRefundFromCharge(charge: Stripe.Charge) {
  const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!pi) return;
  const order = await prisma.order.findFirst({ where: { stripePaymentIntentId: pi } });
  if (!order) return;
  const refunded = charge.amount_refunded;
  if (refunded <= order.refundedAmount) return;
  const delta = refunded - order.refundedAmount;
  await prisma.order.update({
    where: { id: order.id },
    data: {
      refundedAmount: refunded,
      status: refunded >= order.total ? "REFUNDED" : "PARTIALLY_REFUNDED",
      events: { create: { type: "refund", message: `Remboursement de ${(delta / 100).toFixed(2)} € (total remboursé : ${(refunded / 100).toFixed(2)} €).` } },
    },
  });
  await sendRefundNotification(order.id, delta);
}

/** Remboursement déclenché depuis l'administration. Le statut est confirmé par le webhook charge.refunded. */
export async function refundOrder(orderId: string, amount: number, restock: boolean) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe n'est pas configuré.");
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  if (!order.stripePaymentIntentId) throw new Error("Aucun paiement Stripe associé à cette commande.");
  const remaining = order.total - order.refundedAmount;
  if (amount <= 0 || amount > remaining) throw new Error(`Montant invalide (maximum ${(remaining / 100).toFixed(2)} €).`);

  const refund = await stripe.refunds.create(
    { payment_intent: order.stripePaymentIntentId, amount, metadata: { orderId } },
    { idempotencyKey: `refund-${orderId}-${order.refundedAmount}-${amount}` },
  );
  if (refund.status === "failed" || refund.status === "canceled") throw new Error("Stripe a refusé le remboursement.");

  if (restock) {
    await prisma.$transaction(async (tx) => {
      for (const i of order.items) if (i.variantId) await tx.variant.update({ where: { id: i.variantId }, data: { stock: { increment: i.quantity } } });
      await tx.orderEvent.create({ data: { orderId, type: "restock", message: "Articles remis en stock suite au remboursement." } });
    });
  }
  const charge = refund.charge ? await stripe.charges.retrieve(typeof refund.charge === "string" ? refund.charge : refund.charge.id) : null;
  if (charge) await applyRefundFromCharge(charge);
}
