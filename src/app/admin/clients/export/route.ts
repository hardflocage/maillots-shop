import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new Response("Accès refusé", { status: 403 });
  const subs = await prisma.newsletterSubscriber.findMany({ where: { unsubscribedAt: null }, orderBy: { consentAt: "desc" } });
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const csv = ["email,date_consentement,source", ...subs.map((s) => [esc(s.email), s.consentAt.toISOString(), esc(s.source ?? "")].join(","))].join("\n");
  return new Response("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="newsletter.csv"' } });
}
