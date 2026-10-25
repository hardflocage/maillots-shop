import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { toggleMessageHandled } from "@/app/actions/admin";
import { PageTitle } from "@/components/admin/ui";

export default async function MessagesAdmin() {
  const messages = await prisma.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 200 });
  return (
    <div className="max-w-4xl">
      <PageTitle title="Messages" subtitle="Formulaire de contact. Répondez directement par e-mail." />
      {messages.length === 0 && <p className="text-bone-muted">Aucun message.</p>}
      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`card p-5 text-sm ${m.handled ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap justify-between gap-2">
              <p><strong>{m.subject}</strong> · {m.name} · <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="text-gold">{m.email}</a>{m.orderNumber && ` · commande ${m.orderNumber}`}</p>
              <span className="text-xs text-bone-dim">{formatDateTime(m.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-bone-muted">{m.message}</p>
            <form action={toggleMessageHandled} className="mt-3"><input type="hidden" name="id" value={m.id} /><button className="rounded-full border border-ink-500 px-3 py-1.5 text-xs text-bone-muted hover:text-bone">{m.handled ? "Marquer non traité" : "Marquer comme traité"}</button></form>
          </div>
        ))}
      </div>
    </div>
  );
}
