import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Client Stripe, ou null si STRIPE_SECRET_KEY n'est pas configurée (aucun paiement fictif n'est simulé). */
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}
