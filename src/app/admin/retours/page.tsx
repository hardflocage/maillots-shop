import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { RETURN_STATUS_LABELS } from "@/lib/labels";
import { updateReturn } from "@/app/actions/admin";
import { PageTitle } from "@/components/admin/ui";

export default async function ReturnsAdmin() {
  const returns = await prisma.returnRequest.findMany({ include: { order: { include: { items: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <div className="max-w-4xl">
      <PageTitle title="Retours et remboursements" subtitle="Pour rembourser, ouvrez la commande et utilisez le bloc « Rembourser »." />
      {returns.length === 0 && <p className="text-bone-muted">Aucune demande.</p>}
      <div className="space-y-4">
        {returns.map((r) => (
          <div key={r.id} className="card p-5 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <p><Link href={`/admin/commandes/${r.orderId}`} className="font-semibold text-gold">{r.order.number}</Link> · {r.order.firstName} {r.order.lastName} · {formatDateTime(r.createdAt)}</p>
              <span className="chip">{RETURN_STATUS_LABELS[r.status]}</span>
            </div>
            <p className="mt-2"><strong>Motif :</strong> {r.reason}</p>
            {r.message && <p className="mt-1 text-bone-muted">{r.message}</p>}
            <p className="mt-1 text-xs text-bone-dim">{r.order.items.map((i) => `${i.quantity}× ${i.productName} (${i.size})${i.customizationName ? " FLOQUÉ" : ""}`).join(" · ")}</p>
            <form action={updateReturn} className="mt-4 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={r.id} />
              <select name="status" defaultValue={r.status} className="input max-w-[180px] py-2">
                {Object.entries(RETURN_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <input name="adminNote" defaultValue={r.adminNote ?? ""} placeholder="Message visible par le client" className="input flex-1 py-2" />
              <button className="btn-ghost py-2">Mettre à jour</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
