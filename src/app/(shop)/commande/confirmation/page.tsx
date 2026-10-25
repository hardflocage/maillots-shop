import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { ConfirmationClient } from "./ConfirmationClient";

export const metadata: Metadata = { title: "Confirmation de commande", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const sessionId = (await searchParams).session_id;
  let order = sessionId ? await prisma.order.findUnique({ where: { stripeSessionId: sessionId }, include: { items: true } }) : null;

  // Si le webhook n'est pas encore arrivé, on interroge directement Stripe (côté serveur).
  if (order && order.status === "PENDING" && sessionId) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const s = await stripe.checkout.sessions.retrieve(sessionId);
        if (s.payment_status === "paid") {
          await markOrderPaid(order.id, typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null, s.amount_total);
          order = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
        }
      } catch (e) {
        console.error("[confirmation] vérification Stripe impossible", e);
      }
    }
  }

  if (!order) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
        <h1 className="h-display text-5xl">Commande introuvable</h1>
        <p className="max-w-md text-bone-muted">Si tu viens de payer, vérifie ta boîte mail ou utilise la page de suivi.</p>
        <Link href="/suivi" className="btn-ghost">Suivre une commande</Link>
      </div>
    );
  }

  const paid = !["PENDING", "EXPIRED", "CANCELLED"].includes(order.status);
  return (
    <div className="container-x py-14 sm:py-20">
      <ConfirmationClient paid={paid} pending={order.status === "PENDING"} />
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow mb-4">Commande {order.number}</p>
        {paid ? (
          <>
            <h1 className="h-display text-5xl sm:text-7xl">Merci {order.firstName} !</h1>
            <p className="mt-5 text-bone-muted">Ton paiement est confirmé. Un e-mail récapitulatif a été envoyé à <span className="text-bone">{order.email}</span>.</p>
          </>
        ) : order.status === "PENDING" ? (
          <>
            <h1 className="h-display text-5xl sm:text-6xl">Validation du paiement…</h1>
            <p className="mt-5 text-bone-muted">Nous attendons la confirmation de ta banque. Cette page se met à jour automatiquement.</p>
          </>
        ) : (
          <>
            <h1 className="h-display text-5xl sm:text-6xl">Paiement non abouti</h1>
            <p className="mt-5 text-bone-muted">Aucun montant n&apos;a été débité. Tu peux repasser commande depuis ton panier.</p>
            <Link href="/panier" className="btn-primary mt-8">Retour au panier</Link>
          </>
        )}
      </div>

      <div className="card mx-auto mt-12 max-w-2xl p-6 sm:p-8">
        <ul className="divide-y divide-ink-600">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                <span className="text-bone">{i.productName}</span> <span className="text-bone-muted">· {i.size} × {i.quantity}</span>
                {i.customizationName && <span className="block text-bone-muted">Flocage : {i.customizationName} · {i.customizationNumber}</span>}
              </span>
              <span>{formatPrice((i.unitPrice + i.customizationPrice) * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-ink-600 pt-4 text-sm text-bone-muted">
          {order.discountTotal > 0 && <p className="flex justify-between"><span>{order.discountLabel}</span><span>−{formatPrice(order.discountTotal)}</span></p>}
          <p className="flex justify-between"><span>Livraison ({order.shippingMethodName})</span><span>{order.shippingCost ? formatPrice(order.shippingCost) : "Offerte"}</span></p>
          <p className="flex justify-between pt-2 text-base font-semibold text-bone"><span>Total</span><span>{formatPrice(order.total)}</span></p>
        </div>
        <p className="mt-6 text-sm text-bone-muted">Livraison : {order.firstName} {order.lastName}, {order.line1}{order.line2 ? `, ${order.line2}` : ""}, {order.postalCode} {order.city}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={`/suivi?commande=${order.number}&email=${encodeURIComponent(order.email)}`} className="btn-ghost flex-1">Suivre ma commande</Link>
          <Link href="/boutique" className="btn-primary flex-1">Continuer mes achats</Link>
        </div>
      </div>
    </div>
  );
}
