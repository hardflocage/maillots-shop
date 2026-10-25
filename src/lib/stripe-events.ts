import "server-only";
import type Stripe from "stripe";
import { prisma } from "./prisma";
import { markOrderPaid, releaseOrder } from "./orders";
import { applyRefundFromCharge } from "./refunds";

async function orderIdFrom(session: Stripe.Checkout.Session) {
  if (session.metadata?.orderId) return session.metadata.orderId;
  const o = await prisma.order.findUnique({ where: { stripeSessionId: session.id }, select: { id: true } });
  return o?.id ?? null;
}

function piId(pi: string | Stripe.PaymentIntent | null) {
  return typeof pi === "string" ? pi : pi?.id ?? null;
}

export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const s = event.data.object;
      if (s.payment_status !== "paid") return; // paiement différé : on attend async_payment_succeeded
      const id = await orderIdFrom(s);
      if (id) await markOrderPaid(id, piId(s.payment_intent), s.amount_total);
      return;
    }
    case "checkout.session.async_payment_failed": {
      const id = await orderIdFrom(event.data.object);
      if (id) await releaseOrder(id, "CANCELLED", "Paiement refusé : stock libéré.");
      return;
    }
    case "checkout.session.expired": {
      const id = await orderIdFrom(event.data.object);
      if (id) await releaseOrder(id, "EXPIRED", "Session de paiement expirée : stock libéré.");
      return;
    }
    case "charge.refunded": {
      await applyRefundFromCharge(event.data.object);
      return;
    }
  }
}
