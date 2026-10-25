import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { handleStripeEvent } from "@/lib/stripe-events";

/**
 * Webhook Stripe : SEULE source de vérité pour valider un paiement.
 * La signature est vérifiée avec STRIPE_WEBHOOK_SECRET ; chaque évènement n'est traité qu'une fois.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return new Response("Stripe non configuré", { status: 503 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  try {
    await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    await handleStripeEvent(event);
  } catch (e) {
    console.error(`[stripe] erreur sur ${event.type} ${event.id}`, e);
    await prisma.stripeEvent.delete({ where: { id: event.id } }).catch(() => {});
    return new Response("Erreur de traitement", { status: 500 }); // Stripe réessaiera
  }
  return Response.json({ received: true });
}
