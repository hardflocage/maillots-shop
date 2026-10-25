import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatPrice, centsToInput } from "@/lib/format";
import { ORDER_STATUS_LABELS, RETURN_STATUS_LABELS } from "@/lib/labels";
import { cancelPendingOrder, refundOrderAction, updateOrder } from "@/app/actions/admin";
import { ActionForm, ConfirmButton } from "@/components/admin/ActionForm";
import { Alert, Check, Field, PageTitle } from "@/components/admin/ui";
import type { OrderStatus } from "@prisma/client";

const NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"],
  PREPARING: ["PREPARING", "PAID", "SHIPPED", "DELIVERED"],
  SHIPPED: ["SHIPPED", "PREPARING", "DELIVERED"],
  DELIVERED: ["DELIVERED", "SHIPPED"],
  PARTIALLY_REFUNDED: ["PARTIALLY_REFUNDED", "PREPARING", "SHIPPED", "DELIVERED"],
};

export default async function OrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const order = await prisma.order.findUnique({
    where: { id: (await params).id },
    include: { items: true, events: { orderBy: { createdAt: "desc" } }, returns: true, user: { select: { email: true } }, promoCode: { select: { code: true } } },
  });
  if (!order) notFound();
  const options = NEXT[order.status];
  const refundable = order.total - order.refundedAmount;
  const stripeUrl = order.stripePaymentIntentId ? `https://dashboard.stripe.com/${process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "" : "test/"}payments/${order.stripePaymentIntentId}` : null;

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/commandes" className="text-sm text-bone-muted hover:text-bone">← Commandes</Link>
      <PageTitle title={`Commande ${order.number}`} subtitle={`${formatDateTime(order.createdAt)} · ${ORDER_STATUS_LABELS[order.status]}`}>
        {stripeUrl && <a href={stripeUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">Paiement dans Stripe ↗</a>}
      </PageTitle>
      {order.events.some((e) => e.message.startsWith("ATTENTION")) && <Alert>Cette commande comporte un avertissement : voir l&apos;historique.</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Articles et flocage à préparer</h2>
            <ul className="divide-y divide-ink-600">
              {order.items.map((i) => (
                <li key={i.id} className="flex gap-4 py-3">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-ink-700">{i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="64px" className="object-cover" unoptimized={i.imageUrl.endsWith(".svg")} />}</div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{i.productName}</p>
                    <p className="text-bone-muted">Taille <strong className="text-bone">{i.size}</strong> × {i.quantity}</p>
                    {i.customizationName ? (
                      <p className="mt-1 inline-block rounded-lg bg-gold/15 px-3 py-1.5 text-gold">FLOCAGE : <strong>{i.customizationName}</strong> · n° <strong>{i.customizationNumber}</strong></p>
                    ) : <p className="text-bone-dim">Sans flocage</p>}
                  </div>
                  <p className="text-sm">{formatPrice((i.unitPrice + i.customizationPrice) * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-ink-600 pt-3 text-sm text-bone-muted">
              <p className="flex justify-between"><span>Sous-total</span><span>{formatPrice(order.subtotal)}</span></p>
              {order.discountTotal > 0 && <p className="flex justify-between"><span>{order.discountLabel}{order.promoCode && ` (${order.promoCode.code})`}</span><span>−{formatPrice(order.discountTotal)}</span></p>}
              <p className="flex justify-between"><span>Livraison ({order.shippingMethodName})</span><span>{formatPrice(order.shippingCost)}</span></p>
              {order.refundedAmount > 0 && <p className="flex justify-between text-signal"><span>Remboursé</span><span>−{formatPrice(order.refundedAmount)}</span></p>}
              <p className="flex justify-between text-base font-semibold text-bone"><span>Total payé</span><span>{formatPrice(order.total)}</span></p>
            </div>
          </section>

          {options ? (
            <section className="card p-5">
              <h2 className="mb-4 font-semibold">Traitement et expédition</h2>
              <ActionForm action={updateOrder} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="id" value={order.id} />
                <Field label="Statut">
                  <select name="status" defaultValue={order.status} className="input">
                    {options.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
                  </select>
                </Field>
                <Field label="Transporteur"><input name="carrier" defaultValue={order.carrier ?? ""} className="input" placeholder="Colissimo, Mondial Relay…" /></Field>
                <Field label="Numéro de suivi"><input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className="input" /></Field>
                <Field label="Lien de suivi (facultatif)"><input name="trackingUrl" defaultValue={order.trackingUrl ?? ""} className="input" placeholder="https://…" /></Field>
                <Field label="Note interne" className="sm:col-span-2"><textarea name="adminNote" rows={2} defaultValue={order.adminNote ?? ""} className="input" /></Field>
                <div className="sm:col-span-2"><Check name="notify" label="Prévenir le client par e-mail (expédition / livraison)" defaultChecked /></div>
              </ActionForm>
            </section>
          ) : order.status === "PENDING" ? (
            <section className="card p-5 text-sm text-bone-muted">
              <p>En attente de paiement : le stock est réservé jusqu&apos;au {order.expiresAt ? formatDateTime(order.expiresAt) : "—"}, puis libéré automatiquement.</p>
              <form action={cancelPendingOrder} className="mt-3"><input type="hidden" name="id" value={order.id} /><ConfirmButton message="Annuler et libérer le stock ?" className="btn-danger py-2">Annuler et libérer le stock</ConfirmButton></form>
            </section>
          ) : null}

          {order.stripePaymentIntentId && refundable > 0 && (
            <section className="card p-5">
              <h2 className="mb-1 font-semibold">Rembourser</h2>
              <p className="mb-4 text-sm text-bone-muted">Remboursement réel via Stripe sur le moyen de paiement du client. Maximum : {formatPrice(refundable)}.</p>
              <ActionForm action={refundOrderAction} className="grid gap-4 sm:grid-cols-2" submitLabel="Rembourser via Stripe">
                <input type="hidden" name="id" value={order.id} />
                <Field label="Montant (€)"><input name="amount" required defaultValue={centsToInput(refundable)} className="input" inputMode="decimal" /></Field>
                <div className="flex items-end pb-3"><Check name="restock" label="Remettre les articles en stock" /></div>
              </ActionForm>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="card space-y-1 p-5 text-sm">
            <h2 className="mb-3 font-semibold">Client</h2>
            <p>{order.firstName} {order.lastName}</p>
            <p><a href={`mailto:${order.email}`} className="text-gold">{order.email}</a></p>
            {order.phone && <p>{order.phone}</p>}
            <p className="text-bone-dim">{order.user ? "Compte client" : "Commande invité"}{order.marketingConsent && " · accepte un rappel"}</p>
            <h3 className="pt-4 font-semibold">Livraison</h3>
            <p className="text-bone-muted">{order.line1}{order.line2 && <><br />{order.line2}</>}<br />{order.postalCode} {order.city} · {order.country}</p>
            {order.relayPoint && <p className="text-bone-muted">Point relais : {order.relayPoint}</p>}
          </section>
          {order.returns.length > 0 && (
            <section className="card p-5 text-sm">
              <h2 className="mb-2 font-semibold">Demandes de retour</h2>
              {order.returns.map((r) => <p key={r.id}>{r.reason} · <strong>{RETURN_STATUS_LABELS[r.status]}</strong> · <Link href="/admin/retours" className="text-gold underline">gérer</Link></p>)}
            </section>
          )}
          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Historique</h2>
            <ol className="space-y-3 text-sm">
              {order.events.map((e) => (
                <li key={e.id} className={e.message.startsWith("ATTENTION") ? "text-signal" : "text-bone-muted"}>
                  <span className="block text-xs text-bone-dim">{formatDateTime(e.createdAt)}</span>{e.message}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
