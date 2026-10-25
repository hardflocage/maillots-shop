import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { moderateReview } from "@/app/actions/admin";
import { PageTitle } from "@/components/admin/ui";

export default async function ReviewsAdmin() {
  const reviews = await prisma.review.findMany({ include: { user: { select: { name: true, email: true } }, product: { select: { name: true } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  return (
    <div className="max-w-4xl">
      <PageTitle title="Avis clients" subtitle="Seuls les clients avec une commande livrée peuvent déposer un avis. Rien n'est publié sans votre validation." />
      {reviews.length === 0 && <p className="text-bone-muted">Aucun avis pour le moment.</p>}
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="card p-5 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <p><span className="text-gold">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span> · {r.product.name}</p>
              <span className="chip">{r.status === "PENDING" ? "En attente" : r.status === "APPROVED" ? "Publié" : "Refusé"}</span>
            </div>
            {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
            <p className="mt-1 text-bone-muted">{r.body}</p>
            <p className="mt-2 text-xs text-bone-dim">{r.user.name} ({r.user.email}) · {formatDate(r.createdAt)}</p>
            <div className="mt-3 flex gap-2">
              {(["APPROVED", "REJECTED", "DELETE"] as const).map((s) => (
                <form key={s} action={moderateReview}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={s} /><button className={`rounded-full border px-3 py-1.5 text-xs ${s === "APPROVED" ? "border-pitch/40 text-pitch" : s === "DELETE" ? "border-signal/40 text-signal" : "border-ink-500 text-bone-muted"}`}>{s === "APPROVED" ? "Publier" : s === "REJECTED" ? "Refuser" : "Supprimer"}</button></form>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
