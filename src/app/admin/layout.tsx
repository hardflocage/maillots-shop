import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [settings, toShip, returns, reviews, messages] = await Promise.all([
    getSettings(),
    prisma.order.count({ where: { status: { in: ["PAID", "PREPARING"] } } }),
    prisma.returnRequest.count({ where: { status: "REQUESTED" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.contactMessage.count({ where: { handled: false } }),
  ]);
  return (
    <div className="min-h-dvh bg-ink lg:flex">
      <AdminNav shopName={settings.shopName} badges={{ "/admin/commandes": toShip, "/admin/retours": returns, "/admin/avis": reviews, "/admin/messages": messages }} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
