import type { OrderStatus } from "@prisma/client";
import { formatDateTime } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/labels";
import { IconCheck } from "@/components/ui/Icons";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PAID", label: "Payée" },
  { status: "PREPARING", label: "En préparation" },
  { status: "SHIPPED", label: "Expédiée" },
  { status: "DELIVERED", label: "Livrée" },
];

/** Frise de statut basée uniquement sur les informations réelles de la commande. */
export function OrderTimeline({ order }: { order: { status: OrderStatus; paidAt: Date | null; shippedAt: Date | null; deliveredAt: Date | null; carrier: string | null; trackingNumber: string | null; trackingUrl: string | null } }) {
  if (["PENDING", "EXPIRED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(order.status)) {
    return <p className="rounded-xl bg-ink-700 px-4 py-3 text-sm text-bone">Statut : <strong>{ORDER_STATUS_LABELS[order.status]}</strong></p>;
  }
  const current = STEPS.findIndex((s) => s.status === order.status);
  const dates: Record<string, Date | null> = { PAID: order.paidAt, SHIPPED: order.shippedAt, DELIVERED: order.deliveredAt };
  return (
    <div>
      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => {
          const done = i <= current;
          return (
            <li key={s.status} className="flex flex-col items-center text-center">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${done ? "border-gold bg-gold text-ink" : "border-ink-500 text-bone-dim"}`}>{done ? <IconCheck width={16} height={16} /> : i + 1}</span>
              <span className={`mt-2 text-xs sm:text-sm ${done ? "text-bone" : "text-bone-dim"}`}>{s.label}</span>
              {dates[s.status] && <span className="mt-0.5 hidden text-[11px] text-bone-dim sm:block">{formatDateTime(dates[s.status]!)}</span>}
            </li>
          );
        })}
      </ol>
      {order.trackingNumber && (
        <div className="mt-6 rounded-xl border border-ink-600 p-4 text-sm">
          <p className="text-bone-muted">Transporteur : <span className="text-bone">{order.carrier ?? "—"}</span></p>
          <p className="text-bone-muted">N° de suivi : <span className="font-mono text-bone">{order.trackingNumber}</span></p>
          {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-3 py-2.5">Suivre le colis chez le transporteur</a>}
        </div>
      )}
    </div>
  );
}
