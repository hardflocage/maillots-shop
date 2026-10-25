import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { integrationStatus } from "@/lib/settings";
import { SOLD_STATUSES } from "@/lib/catalog";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/labels";
import { deleteDemoProducts } from "@/app/actions/admin";
import { Alert, PageTitle, Stat, Table } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ActionForm";

async function revenueSince(since: Date) {
  const r = await prisma.order.aggregate({ where: { status: { in: [...SOLD_STATUSES, "REFUNDED"] }, paidAt: { gte: since } }, _sum: { total: true, refundedAmount: true }, _count: true });
  return { revenue: (r._sum.total ?? 0) - (r._sum.refundedAmount ?? 0), count: r._count };
}

export default async function Dashboard() {
  const now = new Date();
  const day = new Date(now); day.setHours(0, 0, 0, 0);
  const d30 = new Date(now.getTime() - 30 * 86400_000);
  const year = new Date(now.getFullYear(), 0, 1);
  const integ = integrationStatus();

  const [today, month, ytd, all, toShip, latest, top, lowStock, demoCount, daily] = await Promise.all([
    revenueSince(day),
    revenueSince(d30),
    revenueSince(year),
    revenueSince(new Date(0)),
    prisma.order.count({ where: { status: { in: ["PAID", "PREPARING"] } } }),
    prisma.order.findMany({ where: { status: { not: "PENDING" } }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.orderItem.groupBy({ by: ["productName"], where: { order: { status: { in: SOLD_STATUSES } } }, _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 8 }),
    prisma.$queryRaw<{ id: string; size: string; stock: number; name: string; productId: string }[]>`
      SELECT v.id, v.size, v.stock, p.name, p.id as "productId" FROM "Variant" v JOIN "Product" p ON p.id = v."productId"
      WHERE p."isActive" = true AND v.stock <= v."lowStockThreshold" ORDER BY v.stock ASC, p.name LIMIT 30`,
    prisma.product.count({ where: { isDemo: true } }),
    prisma.$queryRaw<{ d: Date; total: bigint }[]>`
      SELECT date_trunc('day', "paidAt") d, SUM(total - "refundedAmount")::bigint total FROM "Order"
      WHERE "paidAt" >= ${d30} AND status IN ('PAID','PREPARING','SHIPPED','DELIVERED','PARTIALLY_REFUNDED','REFUNDED') GROUP BY 1 ORDER BY 1`,
  ]);

  const series = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 86400_000); d.setHours(0, 0, 0, 0);
    const hit = daily.find((x) => new Date(x.d).toDateString() === d.toDateString());
    return { d, v: hit ? Number(hit.total) : 0 };
  });
  const maxV = Math.max(...series.map((s) => s.v), 1);

  return (
    <div className="space-y-8">
      <PageTitle title="Tableau de bord" subtitle="Chiffres calculés à partir des paiements confirmés par Stripe (remboursements déduits)." />

      <div className="space-y-2">
        {!integ.stripe && <Alert>Paiements désactivés : ajoutez STRIPE_SECRET_KEY (voir le guide de mise en ligne). Les clients ne peuvent pas encore payer.</Alert>}
        {integ.stripe && !integ.stripeWebhook && <Alert>Webhook Stripe non configuré (STRIPE_WEBHOOK_SECRET) : les paiements ne seront pas confirmés automatiquement.</Alert>}
        {integ.stripe && !integ.stripeLive && <Alert tone="info">Stripe est en <strong>mode test</strong> : aucun vrai paiement n&apos;est encaissé.</Alert>}
        {!integ.email && <Alert>E-mails non configurés (RESEND_API_KEY) : les confirmations de commande ne sont pas envoyées.</Alert>}
        {!integ.storage && <Alert tone="info">Photos stockées localement (développement). En ligne, configurez Supabase Storage.</Alert>}
        {demoCount > 0 && (
          <Alert tone="info">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{demoCount} produits de démonstration sont visibles sur la boutique.</span>
              <form action={deleteDemoProducts}><ConfirmButton message="Supprimer tous les produits de démonstration ?" className="rounded-full border border-bone/30 px-4 py-1.5 text-xs text-bone hover:bg-white/10">Supprimer les produits démo</ConfirmButton></form>
            </div>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Aujourd'hui" value={formatPrice(today.revenue)} hint={`${today.count} commande(s)`} />
        <Stat label="30 derniers jours" value={formatPrice(month.revenue)} hint={`${month.count} commande(s) · panier moyen ${month.count ? formatPrice(Math.round(month.revenue / month.count)) : "—"}`} />
        <Stat label="Depuis janvier" value={formatPrice(ytd.revenue)} hint={`${ytd.count} commande(s)`} />
        <Stat label="À expédier" value={String(toShip)} hint={`Total historique : ${formatPrice(all.revenue)}`} />
      </div>

      <div className="card p-5">
        <p className="mb-4 text-xs uppercase tracking-[0.16em] text-bone-dim">Chiffre d&apos;affaires · 30 jours</p>
        <div className="flex h-40 items-end gap-1" role="img" aria-label="Chiffre d'affaires quotidien sur 30 jours">
          {series.map((s) => (
            <div key={s.d.toISOString()} className="group relative flex-1">
              <div className="w-full rounded-t bg-gold/80 transition group-hover:bg-gold" style={{ height: `${Math.max((s.v / maxV) * 150, s.v ? 4 : 1)}px` }} />
              <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink-600 px-2 py-1 text-[11px] group-hover:block">{s.d.toLocaleDateString("fr-FR")} · {formatPrice(s.v)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div>
          <h2 className="mb-3 font-semibold">Dernières commandes</h2>
          <Table head={["N°", "Client", "Total", "Statut"]}>
            {latest.map((o) => (
              <tr key={o.id} className="hover:bg-white/5">
                <td className="px-4 py-3"><Link href={`/admin/commandes/${o.id}`} className="text-gold hover:underline">{o.number}</Link><span className="block text-xs text-bone-dim">{formatDateTime(o.createdAt)}</span></td>
                <td className="px-4 py-3">{o.firstName} {o.lastName}</td>
                <td className="px-4 py-3">{formatPrice(o.total)}</td>
                <td className="px-4 py-3">{ORDER_STATUS_LABELS[o.status]}</td>
              </tr>
            ))}
            {latest.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-bone-muted">Aucune commande pour l&apos;instant.</td></tr>}
          </Table>
        </div>
        <div className="space-y-8">
          <div>
            <h2 className="mb-3 font-semibold">Produits les plus vendus</h2>
            <Table head={["Produit", "Vendus"]}>
              {top.map((t) => <tr key={t.productName}><td className="px-4 py-3">{t.productName}</td><td className="px-4 py-3">{t._sum.quantity}</td></tr>)}
              {top.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-bone-muted">Pas encore de ventes.</td></tr>}
            </Table>
          </div>
          <div>
            <h2 className="mb-3 font-semibold">Alertes de stock {lowStock.length > 0 && <span className="text-signal">({lowStock.length})</span>}</h2>
            <Table head={["Produit", "Taille", "Stock"]}>
              {lowStock.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3"><Link href={`/admin/produits/${v.productId}`} className="hover:text-gold">{v.name}</Link></td>
                  <td className="px-4 py-3">{v.size}</td>
                  <td className={`px-4 py-3 font-semibold ${v.stock <= 0 ? "text-signal" : "text-gold"}`}>{v.stock <= 0 ? "Rupture" : v.stock}</td>
                </tr>
              ))}
              {lowStock.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-bone-muted">Aucun stock bas.</td></tr>}
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
