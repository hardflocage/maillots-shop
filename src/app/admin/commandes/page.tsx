import Link from "next/link";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/labels";
import { PageTitle, Table } from "@/components/admin/ui";

const FILTERS: [string, string, OrderStatus[] | null][] = [
  ["a-traiter", "À traiter", ["PAID", "PREPARING"]],
  ["expediees", "Expédiées", ["SHIPPED"]],
  ["livrees", "Livrées", ["DELIVERED"]],
  ["remboursees", "Remboursées", ["REFUNDED", "PARTIALLY_REFUNDED"]],
  ["non-payees", "Non payées", ["PENDING", "EXPIRED", "CANCELLED"]],
  ["toutes", "Toutes", null],
];

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ f?: string; q?: string }> }) {
  const { f = "a-traiter", q } = await searchParams;
  const statuses = FILTERS.find((x) => x[0] === f)?.[2];
  const where: Prisma.OrderWhereInput = {
    ...(statuses ? { status: { in: statuses } } : {}),
    ...(q ? { OR: [{ number: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const orders = await prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <PageTitle title="Commandes" />
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map(([k, l]) => <Link key={k} href={`/admin/commandes?f=${k}`} className={`rounded-full border px-4 py-2 text-sm ${f === k ? "border-gold text-gold" : "border-ink-500 text-bone-muted hover:text-bone"}`}>{l}</Link>)}
        <form className="ml-auto flex gap-2"><input type="hidden" name="f" value="toutes" /><input name="q" defaultValue={q} placeholder="N°, e-mail, nom…" className="input py-2" /></form>
      </div>
      <Table head={["Commande", "Client", "Articles", "Total", "Statut"]}>
        {orders.map((o) => (
          <tr key={o.id} className="hover:bg-white/5">
            <td className="px-4 py-3"><Link href={`/admin/commandes/${o.id}`} className="font-medium text-gold hover:underline">{o.number}</Link><span className="block text-xs text-bone-dim">{formatDateTime(o.createdAt)}</span></td>
            <td className="px-4 py-3">{o.firstName} {o.lastName}<span className="block text-xs text-bone-dim">{o.email}</span></td>
            <td className="px-4 py-3 text-xs text-bone-muted">
              {o.items.map((i) => <span key={i.id} className="block">{i.quantity}× {i.productName} ({i.size}){i.customizationName && <strong className="text-gold"> · {i.customizationName} {i.customizationNumber}</strong>}</span>)}
            </td>
            <td className="px-4 py-3">{formatPrice(o.total)}</td>
            <td className="px-4 py-3">{ORDER_STATUS_LABELS[o.status]}</td>
          </tr>
        ))}
        {orders.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-bone-muted">Aucune commande.</td></tr>}
      </Table>
    </div>
  );
}
