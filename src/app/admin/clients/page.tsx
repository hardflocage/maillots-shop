import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { setUserRole } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { PageTitle, Table } from "@/components/admin/ui";

export default async function ClientsAdmin() {
  const me = await requireAdmin();
  const [users, subs] = await Promise.all([
    prisma.user.findMany({ include: { _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
  ]);
  return (
    <div className="max-w-5xl space-y-8">
      <PageTitle title="Clients & newsletter">
        <a href="/admin/clients/export" className="btn-ghost">Exporter la newsletter (CSV, {subs} inscrits)</a>
      </PageTitle>
      <Table head={["Client", "Inscrit le", "Commandes", "Rôle"]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3">{u.name}<span className="block text-xs text-bone-dim">{u.email}</span></td>
            <td className="px-4 py-3">{formatDate(u.createdAt)}</td>
            <td className="px-4 py-3">{u._count.orders}</td>
            <td className="px-4 py-3">
              {u.id === me.id ? <span className="text-gold">Admin (vous)</span> : (
                <form action={setUserRole} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <select name="role" defaultValue={u.role} className="rounded bg-ink-700 px-2 py-1 text-sm"><option value="CUSTOMER">Client</option><option value="ADMIN">Admin</option></select>
                  <button className="text-xs text-bone-muted underline">OK</button>
                </form>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
