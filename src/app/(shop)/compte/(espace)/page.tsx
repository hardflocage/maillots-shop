import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Mes commandes", robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id, status: { notIn: ["PENDING", "EXPIRED", "CANCELLED"] } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  if (orders.length === 0) {
    return (
      <div className="card p-8 text-bone-muted">
        Aucune commande pour le moment. <Link href="/boutique" className="text-bone underline">Découvrir les maillots</Link>
        <p className="mt-3 text-sm text-bone-dim">Une commande passée sans être connecté ? Retrouve-la avec la page <Link className="underline" href="/suivi">Suivi de commande</Link>.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/compte/commandes/${o.number}`} className="card block p-5 transition hover:border-ink-500 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{o.number}</p>
                <p className="text-sm text-bone-muted">{formatDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} article(s) · {formatPrice(o.total)}</p>
              </div>
              <span className="chip">{ORDER_STATUS_LABELS[o.status]}</span>
            </div>
            <p className="mt-3 truncate text-sm text-bone-dim">{o.items.map((i) => `${i.productName} (${i.size})`).join(" · ")}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
