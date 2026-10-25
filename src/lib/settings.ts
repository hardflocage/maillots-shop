import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";

export const getSettings = cache(async () => {
  const s = await prisma.shopSettings.findUnique({ where: { id: 1 } });
  return s ?? prisma.shopSettings.create({ data: { id: 1 } });
});

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** État de configuration des services externes, affiché dans l'administration */
export function integrationStatus() {
  return {
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    stripeLive: (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_"),
    storage: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    email: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
    cron: Boolean(process.env.CRON_SECRET),
  };
}
