"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { escapeHtml, emailParagraph, sendAdminNotification } from "@/lib/email";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

export async function subscribeNewsletter(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("newsletter", 5, 60_000))) return { error: "Trop de tentatives, réessaie dans une minute." };
  const email = z.string().trim().toLowerCase().email().max(200).safeParse(form.get("email"));
  if (!email.success) return { error: "Adresse e-mail invalide." };
  if (form.get("consent") !== "on") return { error: "Merci de cocher la case de consentement." };
  await prisma.newsletterSubscriber.upsert({
    where: { email: email.data },
    update: { unsubscribedAt: null, consentAt: new Date() },
    create: { email: email.data, source: String(form.get("source") ?? "site").slice(0, 40) },
  });
  return { ok: true, message: "Merci ! Tu es inscrit(e) à la newsletter." };
}

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  orderNumber: z.string().trim().max(40).optional(),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(5000),
});

export async function sendContact(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("website")) return { ok: true, message: "Message envoyé." }; // piège à robots
  if (!(await rateLimit("contact", 3, 10 * 60_000))) return { error: "Trop de messages envoyés. Réessaie plus tard." };
  const parsed = contactSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Vérifie les champs : nom, e-mail, sujet et message (10 caractères minimum)." };
  const d = parsed.data;
  await prisma.contactMessage.create({ data: { ...d, orderNumber: d.orderNumber || null } });
  await sendAdminNotification(
    `Contact : ${d.subject}`,
    emailParagraph(`<strong>${escapeHtml(d.name)}</strong> (${escapeHtml(d.email)})${d.orderNumber ? ` · commande ${escapeHtml(d.orderNumber)}` : ""}`) +
      emailParagraph(escapeHtml(d.message).replace(/\n/g, "<br>")),
    d.email,
  );
  return { ok: true, message: "Message bien reçu. Nous te répondons au plus vite par e-mail." };
}
