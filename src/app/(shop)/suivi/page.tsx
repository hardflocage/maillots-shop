import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { formatPrice, formatDate } from "@/lib/format";
import { OrderTimeline } from "@/components/order/OrderTimeline";

export const metadata: Metadata = { title: "Suivi de commande", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TrackingPage({ searchParams }: { searchParams: Promise<{ commande?: string; email?: string }> }) {
  const sp = await searchParams;
  const number = sp.commande?.trim().toUpperCase().slice(0, 30) ?? "";
  const email = sp.email?.trim().toLowerCase().slice(0, 200) ?? "";
  let error: string | null = null;
  let order = null;
  if (number && email) {
    if (!(await rateLimit("tracking", 20, 10 * 60_000))) error = "Trop de recherches. Réessaie dans quelques minutes.";
    else {
      order = await prisma.order.findFirst({ where: { number, email }, include: { items: true } });
      if (!order) error = "Aucune commande ne correspond à ce numéro et cet e-mail.";
    }
  }

  return (
    <div className="container-x max-w-3xl py-14">
      <h1 className="h-display text-5xl sm:text-6xl">Suivi de commande</h1>
      <p className="mt-3 text-bone-muted">Saisis le numéro reçu par e-mail et l&apos;adresse utilisée lors de la commande.</p>
      <form className="mt-8 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" method="get">
        <input name="commande" defaultValue={number} required placeholder="N° de commande (ex. M251025-ABCDE)" className="input" aria-label="Numéro de commande" />
        <input name="email" type="email" defaultValue={email} required placeholder="E-mail" className="input" aria-label="E-mail" />
        <button className="btn-primary">Suivre</button>
      </form>
      {error && <p className="mt-6 rounded-xl bg-signal/10 px-4 py-3 text-sm text-signal">{error}</p>}
      {order && (
        <div className="card mt-10 space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display text-2xl uppercase">{order.number}</p>
            <p className="text-sm text-bone-muted">Passée le {formatDate(order.createdAt)} · {formatPrice(order.total)}</p>
          </div>
          <OrderTimeline order={order} />
          <ul className="divide-y divide-ink-600 border-t border-ink-600 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="py-3">
                {i.productName} · {i.size} × {i.quantity}
                {i.customizationName && <span className="block text-bone-muted">Flocage : {i.customizationName} · {i.customizationNumber}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
