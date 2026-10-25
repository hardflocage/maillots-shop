import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS, RETURN_STATUS_LABELS } from "@/lib/labels";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { ReturnForm, ReviewForm } from "./forms";

export default async function OrderDetail({ params }: { params: Promise<{ number: string }> }) {
  const user = await requireUser();
  const order = await prisma.order.findFirst({
    where: { number: (await params).number, userId: user.id },
    include: { items: { include: { product: { select: { slug: true } } } }, returns: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();
  const reviewed = new Set((await prisma.review.findMany({ where: { userId: user.id }, select: { productId: true } })).map((r) => r.productId));
  const canReturn = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"].includes(order.status) && !order.returns.some((r) => r.status === "REQUESTED" || r.status === "APPROVED");

  return (
    <div className="space-y-6">
      <Link href="/compte" className="text-sm text-bone-muted hover:text-bone">← Mes commandes</Link>
      <div className="card space-y-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-3xl uppercase">{order.number}</h2>
          <p className="text-sm text-bone-muted">{formatDate(order.createdAt)} · {ORDER_STATUS_LABELS[order.status]}</p>
        </div>
        <OrderTimeline order={order} />
        <ul className="divide-y divide-ink-600 border-y border-ink-600">
          {order.items.map((i) => (
            <li key={i.id} className="py-4">
              <div className="flex justify-between gap-4 text-sm">
                <div>
                  {i.product ? <Link href={`/maillot/${i.product.slug}`} className="text-bone hover:text-gold">{i.productName}</Link> : <span>{i.productName}</span>}
                  <p className="text-bone-muted">Taille {i.size} × {i.quantity}</p>
                  {i.customizationName && <p className="text-bone-muted">Flocage : {i.customizationName} · {i.customizationNumber}</p>}
                </div>
                <span>{formatPrice((i.unitPrice + i.customizationPrice) * i.quantity)}</span>
              </div>
              {order.status === "DELIVERED" && i.productId && !reviewed.has(i.productId) && <ReviewForm productId={i.productId} />}
            </li>
          ))}
        </ul>
        <div className="space-y-1 text-sm text-bone-muted">
          <p className="flex justify-between"><span>Sous-total</span><span>{formatPrice(order.subtotal)}</span></p>
          {order.discountTotal > 0 && <p className="flex justify-between"><span>{order.discountLabel}</span><span>−{formatPrice(order.discountTotal)}</span></p>}
          <p className="flex justify-between"><span>Livraison</span><span>{order.shippingCost ? formatPrice(order.shippingCost) : "Offerte"}</span></p>
          {order.refundedAmount > 0 && <p className="flex justify-between text-pitch"><span>Remboursé</span><span>{formatPrice(order.refundedAmount)}</span></p>}
          <p className="flex justify-between pt-2 text-base font-semibold text-bone"><span>Total</span><span>{formatPrice(order.total)}</span></p>
        </div>
        <p className="text-sm text-bone-muted">Livraison : {order.firstName} {order.lastName}, {order.line1}{order.line2 ? `, ${order.line2}` : ""}, {order.postalCode} {order.city}</p>
      </div>

      <div className="card p-6 sm:p-8">
        <h3 className="mb-4 font-display text-2xl uppercase">Retour ou question</h3>
        {order.returns.map((r) => (
          <p key={r.id} className="mb-3 rounded-xl bg-ink-700 px-4 py-3 text-sm">Demande du {formatDate(r.createdAt)} : <strong>{RETURN_STATUS_LABELS[r.status]}</strong>{r.adminNote && <span className="block text-bone-muted">{r.adminNote}</span>}</p>
        ))}
        {canReturn ? <ReturnForm orderId={order.id} /> : <p className="text-sm text-bone-muted">Pour toute question, <Link href="/contact" className="underline">contacte le service client</Link> avec le numéro {order.number}.</p>}
      </div>
    </div>
  );
}
