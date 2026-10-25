"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { endSession, getCurrentUser, hashPassword, requireUser, startSession, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/settings";
import { emailParagraph, escapeHtml, sendAdminNotification, sendPasswordReset } from "@/lib/email";
import type { FormState } from "./public";

function safeNext(next: FormDataEntryValue | null, fallback: string) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

const passwordSchema = z.string().min(8, "8 caractères minimum.").max(200);

export async function login(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("login", 10, 15 * 60_000))) return { error: "Trop de tentatives. Réessaie dans 15 minutes." };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  // comparaison toujours effectuée pour ne pas révéler si le compte existe
  const ok = await verifyPassword(password, user?.passwordHash ?? "$2b$12$EuGyWtFk3En3e2l1qa.I6OTpIVyqqIjc2oxcIvhu.x/v58zuQ.td.");
  if (!user || !ok) return { error: "E-mail ou mot de passe incorrect." };
  await startSession(user);
  redirect(safeNext(form.get("next"), user.role === "ADMIN" ? "/admin" : "/compte"));
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("register", 5, 60 * 60_000))) return { error: "Trop de créations de compte. Réessaie plus tard." };
  const parsed = z
    .object({ name: z.string().trim().min(2).max(100), email: z.string().trim().toLowerCase().email().max(200), password: passwordSchema })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message === "8 caractères minimum." ? "Mot de passe : 8 caractères minimum." : "Vérifie ton nom et ton e-mail." };
  if (await prisma.user.findUnique({ where: { email: parsed.data.email } })) return { error: "Un compte existe déjà avec cet e-mail. Connecte-toi ou réinitialise ton mot de passe." };
  const user = await prisma.user.create({ data: { name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password) } });
  if (form.get("newsletter") === "on") {
    await prisma.newsletterSubscriber.upsert({ where: { email: user.email }, update: { unsubscribedAt: null }, create: { email: user.email, source: "inscription" } });
  }
  await startSession(user);
  redirect(safeNext(form.get("next"), "/compte"));
}

export async function logout() {
  await endSession();
  redirect("/");
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("reset", 5, 60 * 60_000))) return { error: "Trop de demandes. Réessaie plus tard." };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString("base64url");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600_000) },
    });
    await sendPasswordReset(user.email, `${siteUrl()}/compte/reinitialiser?token=${token}`);
  }
  return { ok: true, message: "Si un compte existe avec cet e-mail, un lien de réinitialisation vient d'être envoyé." };
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") ?? "");
  const pwd = passwordSchema.safeParse(form.get("password"));
  if (!pwd.success) return { error: "Mot de passe : 8 caractères minimum." };
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: createHash("sha256").update(token).digest("hex") } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return { error: "Lien invalide ou expiré. Fais une nouvelle demande." };
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await hashPassword(pwd.data) } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  return { ok: true, message: "Mot de passe modifié. Tu peux te connecter." };
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().max(30).optional() }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Vérifie les champs." };
  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name, phone: parsed.data.phone || null } });
  const newPwd = String(form.get("newPassword") ?? "");
  if (newPwd) {
    const full = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await verifyPassword(String(form.get("currentPassword") ?? ""), full.passwordHash))) return { error: "Mot de passe actuel incorrect." };
    if (!passwordSchema.safeParse(newPwd).success) return { error: "Nouveau mot de passe : 8 caractères minimum." };
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPwd) } });
  }
  revalidatePath("/compte");
  return { ok: true, message: "Informations enregistrées." };
}

const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  line1: z.string().trim().min(3).max(120),
  line2: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().min(3).max(12),
  city: z.string().trim().min(1).max(80),
  country: z.string().trim().length(2).default("FR"),
  phone: z.string().trim().max(30).optional(),
});

export async function saveAddress(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = addressSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Adresse incomplète." };
  const id = String(form.get("id") ?? "");
  const isDefault = form.get("isDefault") === "on";
  const data = { ...parsed.data, line2: parsed.data.line2 || null, phone: parsed.data.phone || null, label: parsed.data.label || null, isDefault };
  if (isDefault) await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  if (id) {
    const res = await prisma.address.updateMany({ where: { id, userId: user.id }, data });
    if (res.count === 0) return { error: "Adresse introuvable." };
  } else {
    const count = await prisma.address.count({ where: { userId: user.id } });
    await prisma.address.create({ data: { ...data, userId: user.id, isDefault: isDefault || count === 0 } });
  }
  revalidatePath("/compte/adresses");
  return { ok: true, message: "Adresse enregistrée." };
}

export async function deleteAddress(form: FormData) {
  const user = await requireUser();
  await prisma.address.deleteMany({ where: { id: String(form.get("id")), userId: user.id } });
  revalidatePath("/compte/adresses");
}

export async function toggleFavorite(productId: string) {
  const user = await getCurrentUser();
  if (!user) return false;
  const existing = await prisma.favorite.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
  if (existing) {
    await prisma.favorite.delete({ where: { userId_productId: { userId: user.id, productId } } });
    revalidatePath("/compte/favoris");
    return false;
  }
  if (!(await prisma.product.findUnique({ where: { id: productId }, select: { id: true } }))) return false;
  await prisma.favorite.create({ data: { userId: user.id, productId } });
  revalidatePath("/compte/favoris");
  return true;
}

export async function requestReturn(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const orderId = String(form.get("orderId") ?? "");
  const reason = z.string().trim().min(3).max(200).safeParse(form.get("reason"));
  if (!reason.success) return { error: "Indique le motif du retour." };
  const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id, status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } } });
  if (!order) return { error: "Cette commande ne peut pas faire l'objet d'un retour." };
  if (await prisma.returnRequest.findFirst({ where: { orderId, status: { in: ["REQUESTED", "APPROVED"] } } })) return { error: "Une demande est déjà en cours pour cette commande." };
  const message = String(form.get("message") ?? "").trim().slice(0, 2000) || null;
  await prisma.returnRequest.create({ data: { orderId, userId: user.id, reason: reason.data, message } });
  await sendAdminNotification(`Demande de retour ${order.number}`, emailParagraph(`Motif : ${escapeHtml(reason.data)}<br>${escapeHtml(message ?? "")}`), user.email);
  revalidatePath(`/compte/commandes/${order.number}`);
  return { ok: true, message: "Demande envoyée. Nous revenons vers toi par e-mail." };
}

/** Avis : réservé aux clients dont la commande contenant ce produit a été livrée. Publié après modération. */
export async function submitReview(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const productId = String(form.get("productId") ?? "");
  const parsed = z
    .object({ rating: z.coerce.number().int().min(1).max(5), title: z.string().trim().max(100).optional(), body: z.string().trim().min(10).max(2000) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Note de 1 à 5 et avis de 10 caractères minimum." };
  const bought = await prisma.orderItem.findFirst({ where: { productId, order: { userId: user.id, status: "DELIVERED" } } });
  if (!bought) return { error: "Seuls les clients ayant reçu ce maillot peuvent laisser un avis." };
  await prisma.review.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    update: { ...parsed.data, title: parsed.data.title || null, status: "PENDING" },
    create: { ...parsed.data, title: parsed.data.title || null, userId: user.id, productId },
  });
  return { ok: true, message: "Merci ! Ton avis sera publié après vérification." };
}
