import { prisma } from "@/lib/prisma";
import { expireStaleOrders } from "@/lib/orders";
import { sendAbandonedCartReminder } from "@/lib/email";

/**
 * Tâche planifiée (Vercel Cron) : libère les réservations expirées et envoie UN rappel
 * aux clients ayant explicitement accepté d'être relancés.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Accès refusé", { status: 401 });

  const expired = await expireStaleOrders();
  const candidates = await prisma.order.findMany({
    where: {
      status: { in: ["EXPIRED", "CANCELLED"] },
      marketingConsent: true,
      reminderSentAt: null,
      createdAt: { gte: new Date(Date.now() - 72 * 3600_000), lte: new Date(Date.now() - 60 * 60_000) },
    },
    take: 50,
  });
  let reminders = 0;
  for (const o of candidates) {
    const paidLater = await prisma.order.count({ where: { email: o.email, createdAt: { gt: o.createdAt }, paidAt: { not: null } } });
    await prisma.order.update({ where: { id: o.id }, data: { reminderSentAt: new Date() } });
    if (paidLater) continue;
    if ((await sendAbandonedCartReminder(o.id)).sent) reminders++;
  }
  return Response.json({ expired, reminders });
}
