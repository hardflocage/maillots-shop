"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ImageKind, OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parsePrice, slugify } from "@/lib/format";
import { deleteImage, saveImage } from "@/lib/storage";
import { sendDeliveredNotification, sendShippingNotification } from "@/lib/email";
import { refundOrder } from "@/lib/refunds";
import { releaseOrder } from "@/lib/orders";
import type { FormState } from "./public";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";
const int = (f: FormData, k: string, d = 0) => {
  const n = parseInt(str(f, k), 10);
  return Number.isFinite(n) ? n : d;
};

function revalidateShop() {
  revalidatePath("/", "layout");
}

/* ─────────────── PRODUITS ─────────────── */

const variantsSchema = z.array(z.object({ id: z.string().optional(), size: z.string().trim().min(1).max(20), stock: z.number().int().min(0).max(100000), lowStockThreshold: z.number().int().min(0).max(1000) })).max(30);
const playersSchema = z.array(z.object({ name: z.string().trim().min(1).max(30), number: z.number().int().min(0).max(99) })).max(60);

async function uniqueSlug(base: string, exceptId?: string) {
  let slug = slugify(base) || "maillot";
  for (let i = 2; ; i++) {
    const found = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!found || found.id === exceptId) return slug;
    slug = `${slugify(base)}-${i}`;
  }
}

function productData(form: FormData) {
  const price = parsePrice(str(form, "price"));
  const compareAt = parsePrice(str(form, "compareAtPrice"));
  const customizationPrice = parsePrice(str(form, "customizationPrice")) ?? 0;
  const kit = str(form, "kitType");
  if (!str(form, "name") || !str(form, "club") || !str(form, "season")) throw new Error("Nom, club et saison sont obligatoires.");
  if (price == null || price <= 0) throw new Error("Prix invalide.");
  if (compareAt != null && compareAt <= price) throw new Error("Le prix barré doit être supérieur au prix de vente (ou laissé vide).");
  return {
    name: str(form, "name").slice(0, 120),
    club: str(form, "club").slice(0, 80),
    season: str(form, "season").slice(0, 20),
    kitType: (["HOME", "AWAY", "THIRD", "FOURTH", "GOALKEEPER", "SPECIAL"].includes(kit) ? kit : "HOME") as Prisma.ProductCreateInput["kitType"],
    description: str(form, "description").slice(0, 8000),
    price,
    compareAtPrice: compareAt,
    isActive: bool(form, "isActive"),
    isFeatured: bool(form, "isFeatured"),
    isNew: bool(form, "isNew"),
    deliveryInfo: str(form, "deliveryInfo").slice(0, 300) || null,
    customizationEnabled: bool(form, "customizationEnabled"),
    customizationPrice,
    maxNameLength: Math.min(Math.max(int(form, "maxNameLength", 12), 3), 20),
    flockingColor: /^#[0-9a-fA-F]{6}$/.test(str(form, "flockingColor")) ? str(form, "flockingColor") : "#FFFFFF",
    flockingTop: Math.min(Math.max(int(form, "flockingTop", 22), 5), 60),
  };
}

async function uploadImages(productId: string, form: FormData) {
  const add = async (file: FormDataEntryValue | null, kind: ImageKind, sortOrder: number) => {
    if (!(file instanceof File) || file.size === 0) return;
    if (kind !== "EXTRA") {
      const old = await prisma.productImage.findMany({ where: { productId, kind } });
      for (const o of old) await deleteImage(o.url);
      await prisma.productImage.deleteMany({ where: { productId, kind } });
    }
    const url = await saveImage(file);
    await prisma.productImage.create({ data: { productId, url, kind, sortOrder } });
  };
  await add(form.get("frontImage"), "FRONT", 0);
  await add(form.get("backImage"), "BACK", 1);
  const extras = form.getAll("extraImages");
  const start = await prisma.productImage.count({ where: { productId, kind: "EXTRA" } });
  for (let i = 0; i < extras.length; i++) await add(extras[i], "EXTRA", 10 + start + i);
}

export async function saveProduct(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(form, "id");
  try {
    const data = productData(form);
    const variants = variantsSchema.parse(JSON.parse(str(form, "variants") || "[]"));
    const players = playersSchema.parse(JSON.parse(str(form, "players") || "[]"));
    if (new Set(variants.map((v) => v.size.toUpperCase())).size !== variants.length) throw new Error("Chaque taille ne doit apparaître qu'une fois.");
    const categoryIds = form.getAll("categories").map(String);
    const slug = await uniqueSlug(str(form, "slug") || `${data.name}`, id || undefined);

    const productId = await prisma.$transaction(async (tx) => {
      const p = id
        ? await tx.product.update({ where: { id }, data: { ...data, slug, isDemo: false, categories: { set: categoryIds.map((c) => ({ id: c })) } } })
        : await tx.product.create({ data: { ...data, slug, categories: { connect: categoryIds.map((c) => ({ id: c })) } } });
      // tailles : mise à jour, ajout, suppression (les tailles déjà commandées restent liées aux commandes)
      const existing = await tx.variant.findMany({ where: { productId: p.id } });
      const keep = new Set(variants.filter((v) => v.id).map((v) => v.id));
      for (const e of existing) if (!keep.has(e.id)) await tx.variant.delete({ where: { id: e.id } });
      for (const [i, v] of variants.entries()) {
        if (v.id && existing.some((e) => e.id === v.id)) await tx.variant.update({ where: { id: v.id }, data: { size: v.size, stock: v.stock, lowStockThreshold: v.lowStockThreshold, sortOrder: i } });
        else await tx.variant.create({ data: { productId: p.id, size: v.size, stock: v.stock, lowStockThreshold: v.lowStockThreshold, sortOrder: i } });
      }
      await tx.player.deleteMany({ where: { productId: p.id } });
      if (players.length) await tx.player.createMany({ data: players.map((pl) => ({ ...pl, name: pl.name.toUpperCase(), productId: p.id })) });
      return p.id;
    });
    await uploadImages(productId, form);
    revalidateShop();
    if (!id) redirect(`/admin/produits/${productId}?cree=1`);
    return { ok: true, message: "Produit enregistré." };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
    return { error: e instanceof z.ZodError ? "Tailles ou joueurs invalides." : e instanceof Error ? e.message : "Erreur inconnue." };
  }
}

export async function deleteProductImage(form: FormData) {
  await requireAdmin();
  const img = await prisma.productImage.findUnique({ where: { id: str(form, "imageId") } });
  if (!img) return;
  await prisma.productImage.delete({ where: { id: img.id } });
  await deleteImage(img.url);
  revalidateShop();
}

export async function setImageKind(form: FormData) {
  await requireAdmin();
  const img = await prisma.productImage.findUnique({ where: { id: str(form, "imageId") } });
  const kind = str(form, "kind") as ImageKind;
  if (!img || !["FRONT", "BACK", "EXTRA"].includes(kind)) return;
  await prisma.$transaction(async (tx) => {
    if (kind !== "EXTRA") await tx.productImage.updateMany({ where: { productId: img.productId, kind }, data: { kind: "EXTRA", sortOrder: 50 } });
    await tx.productImage.update({ where: { id: img.id }, data: { kind, sortOrder: kind === "FRONT" ? 0 : kind === "BACK" ? 1 : 20 } });
  });
  revalidateShop();
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  const images = await prisma.productImage.findMany({ where: { productId: id } });
  const sold = await prisma.orderItem.count({ where: { productId: id } });
  if (sold > 0) {
    // l'historique des commandes est conservé : le produit est seulement masqué
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.product.delete({ where: { id } });
    for (const i of images) await deleteImage(i.url);
  }
  revalidateShop();
  redirect("/admin/produits");
}

export async function deleteDemoProducts() {
  await requireAdmin();
  const demos = await prisma.product.findMany({ where: { isDemo: true }, select: { id: true } });
  for (const d of demos) {
    const sold = await prisma.orderItem.count({ where: { productId: d.id } });
    if (sold) await prisma.product.update({ where: { id: d.id }, data: { isActive: false } });
    else await prisma.product.delete({ where: { id: d.id } });
  }
  await prisma.promoCode.deleteMany({ where: { code: "DEMO10", usedCount: 0 } });
  revalidateShop();
  redirect("/admin/produits");
}

export async function quickUpdateStock(form: FormData) {
  await requireAdmin();
  const entries = [...form.entries()].filter(([k]) => k.startsWith("stock_"));
  for (const [k, v] of entries) {
    const n = parseInt(String(v), 10);
    if (Number.isFinite(n) && n >= 0) await prisma.variant.update({ where: { id: k.slice(6) }, data: { stock: n } });
  }
  revalidateShop();
}

/* ─────────────── CATÉGORIES ─────────────── */

export async function saveCategory(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const name = str(form, "name");
  if (!name) return { error: "Nom obligatoire." };
  const id = str(form, "id");
  const type = str(form, "type");
  const data = {
    name: name.slice(0, 60),
    description: str(form, "description").slice(0, 500) || null,
    type: (["LEAGUE", "NATIONAL", "RETRO", "COMPETITION", "SPECIAL"].includes(type) ? type : "LEAGUE") as Prisma.CategoryCreateInput["type"],
    sortOrder: int(form, "sortOrder"),
    isActive: bool(form, "isActive"),
    showOnHome: bool(form, "showOnHome"),
  };
  const slug = slugify(str(form, "slug") || name);
  const clash = await prisma.category.findUnique({ where: { slug } });
  if (clash && clash.id !== id) return { error: "Une catégorie utilise déjà cette adresse (slug)." };
  if (id) await prisma.category.update({ where: { id }, data: { ...data, slug } });
  else await prisma.category.create({ data: { ...data, slug } });
  revalidateShop();
  return { ok: true, message: "Catégorie enregistrée." };
}

export async function deleteCategory(form: FormData) {
  await requireAdmin();
  await prisma.category.delete({ where: { id: str(form, "id") } });
  revalidateShop();
}

/* ─────────────── COMMANDES ─────────────── */

const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID: ["PREPARING", "SHIPPED", "DELIVERED"],
  PREPARING: ["PAID", "SHIPPED", "DELIVERED"],
  SHIPPED: ["PREPARING", "DELIVERED"],
  DELIVERED: ["SHIPPED"],
  PARTIALLY_REFUNDED: ["PREPARING", "SHIPPED", "DELIVERED"],
};

export async function updateOrder(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id: str(form, "id") } });
  if (!order) return { error: "Commande introuvable." };
  const status = str(form, "status") as OrderStatus;
  const carrier = str(form, "carrier") || null;
  const trackingNumber = str(form, "trackingNumber") || null;
  const trackingUrl = str(form, "trackingUrl") || null;
  if (trackingUrl && !/^https?:\/\//.test(trackingUrl)) return { error: "Le lien de suivi doit commencer par https://" };
  const notify = bool(form, "notify");

  const data: Prisma.OrderUpdateInput = { carrier, trackingNumber, trackingUrl, adminNote: str(form, "adminNote").slice(0, 2000) || null };
  const events: string[] = [];
  if (status && status !== order.status) {
    if (!ALLOWED_TRANSITIONS[order.status]?.includes(status)) return { error: "Changement de statut impossible depuis l'état actuel." };
    if (status === "SHIPPED" && !trackingNumber) return { error: "Renseigne le numéro de suivi avant de marquer la commande comme expédiée." };
    data.status = status;
    if (status === "SHIPPED" && !order.shippedAt) data.shippedAt = new Date();
    if (status === "DELIVERED") data.deliveredAt = new Date();
    events.push(`Statut modifié : ${order.status} → ${status}`);
  }
  if (trackingNumber && trackingNumber !== order.trackingNumber) events.push(`Suivi : ${carrier ?? ""} ${trackingNumber}`);
  await prisma.order.update({ where: { id: order.id }, data: { ...data, events: { create: events.map((m) => ({ type: "admin", message: m })) } } });

  if (notify && status !== order.status) {
    const r = status === "SHIPPED" ? await sendShippingNotification(order.id) : status === "DELIVERED" ? await sendDeliveredNotification(order.id) : null;
    if (r && !r.sent) {
      revalidatePath(`/admin/commandes/${order.id}`);
      return { ok: true, message: "Commande mise à jour. ⚠ E-mail non envoyé : service e-mail non configuré." };
    }
  }
  revalidatePath(`/admin/commandes/${order.id}`);
  return { ok: true, message: "Commande mise à jour." };
}

export async function refundOrderAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const amount = parsePrice(str(form, "amount"));
  if (amount == null) return { error: "Montant invalide." };
  try {
    await refundOrder(str(form, "id"), amount, bool(form, "restock"));
    revalidatePath(`/admin/commandes/${str(form, "id")}`);
    return { ok: true, message: "Remboursement effectué via Stripe." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Échec du remboursement." };
  }
}

export async function cancelPendingOrder(form: FormData) {
  await requireAdmin();
  await releaseOrder(str(form, "id"), "CANCELLED", "Annulée par l'administrateur avant paiement.");
  revalidatePath("/admin/commandes");
}

export async function updateReturn(form: FormData) {
  await requireAdmin();
  const status = str(form, "status");
  if (!["REQUESTED", "APPROVED", "REJECTED", "REFUNDED"].includes(status)) return;
  await prisma.returnRequest.update({ where: { id: str(form, "id") }, data: { status: status as "APPROVED", adminNote: str(form, "adminNote").slice(0, 1000) || null } });
  revalidatePath("/admin/retours");
}

/* ─────────────── PROMOTIONS ─────────────── */

export async function savePromoCode(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const code = str(form, "code").toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (code.length < 3) return { error: "Code de 3 caractères minimum (lettres, chiffres)." };
  const type = str(form, "type") === "FIXED" ? "FIXED" : "PERCENT";
  const value = type === "FIXED" ? parsePrice(str(form, "value")) : int(form, "value");
  if (!value || value <= 0 || (type === "PERCENT" && value > 90)) return { error: "Valeur invalide (pourcentage entre 1 et 90, ou montant en euros)." };
  const data = {
    code,
    type: type as "PERCENT" | "FIXED",
    value,
    minSubtotal: parsePrice(str(form, "minSubtotal")),
    maxUses: str(form, "maxUses") ? int(form, "maxUses") : null,
    startsAt: str(form, "startsAt") ? new Date(str(form, "startsAt")) : null,
    expiresAt: str(form, "expiresAt") ? new Date(`${str(form, "expiresAt")}T23:59:59`) : null,
    isActive: bool(form, "isActive"),
  };
  const id = str(form, "id");
  const clash = await prisma.promoCode.findUnique({ where: { code } });
  if (clash && clash.id !== id) return { error: "Ce code existe déjà." };
  if (id) await prisma.promoCode.update({ where: { id }, data });
  else await prisma.promoCode.create({ data });
  revalidatePath("/admin/codes-promo");
  return { ok: true, message: "Code enregistré." };
}

export async function deletePromoCode(form: FormData) {
  await requireAdmin();
  await prisma.promoCode.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/codes-promo");
}

export async function saveAutoDiscount(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const minQuantity = int(form, "minQuantity");
  const percentOff = int(form, "percentOff");
  if (minQuantity < 2 || percentOff < 1 || percentOff > 90) return { error: "Quantité minimum 2, réduction entre 1 et 90 %." };
  const data = { name: str(form, "name").slice(0, 60) || `Offre ${minQuantity} maillots`, minQuantity, percentOff, isActive: bool(form, "isActive") };
  const id = str(form, "id");
  if (id) await prisma.autoDiscount.update({ where: { id }, data });
  else await prisma.autoDiscount.create({ data });
  revalidatePath("/admin/codes-promo");
  return { ok: true, message: "Remise enregistrée." };
}

export async function deleteAutoDiscount(form: FormData) {
  await requireAdmin();
  await prisma.autoDiscount.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/codes-promo");
}

/* ─────────────── LIVRAISON ─────────────── */

export async function saveShippingMethod(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const price = parsePrice(str(form, "price"));
  if (!str(form, "name") || price == null) return { error: "Nom et prix obligatoires." };
  const data = {
    name: str(form, "name").slice(0, 80),
    description: str(form, "description").slice(0, 300) || null,
    type: (str(form, "type") === "RELAY" ? "RELAY" : "HOME") as "HOME" | "RELAY",
    price,
    freeOver: parsePrice(str(form, "freeOver")),
    deliveryTime: str(form, "deliveryTime").slice(0, 120) || null,
    isActive: bool(form, "isActive"),
    sortOrder: int(form, "sortOrder"),
  };
  const id = str(form, "id");
  if (id) await prisma.shippingMethod.update({ where: { id }, data });
  else await prisma.shippingMethod.create({ data });
  revalidateShop();
  return { ok: true, message: "Mode de livraison enregistré." };
}

export async function deleteShippingMethod(form: FormData) {
  await requireAdmin();
  await prisma.shippingMethod.delete({ where: { id: str(form, "id") } });
  revalidateShop();
}

/* ─────────────── CONTENUS & PARAMÈTRES ─────────────── */

export async function savePage(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const slug = str(form, "slug");
  if (!slug || !str(form, "title")) return { error: "Titre obligatoire." };
  await prisma.page.update({ where: { slug }, data: { title: str(form, "title").slice(0, 120), content: str(form, "content").slice(0, 50000) } });
  revalidateShop();
  return { ok: true, message: "Page enregistrée." };
}

export async function saveSettings(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const url = (k: string) => {
    const v = str(form, k);
    return v && /^https:\/\//.test(v) ? v.slice(0, 300) : null;
  };
  const data: Prisma.ShopSettingsUpdateInput = {
    shopName: str(form, "shopName").slice(0, 40) || "MAILLOT",
    tagline: str(form, "tagline").slice(0, 120),
    heroTitle: str(form, "heroTitle").slice(0, 80) || "Porte tes couleurs.",
    heroSubtitle: str(form, "heroSubtitle").slice(0, 300),
    announcement: str(form, "announcement").slice(0, 140) || null,
    aboutTitle: str(form, "aboutTitle").slice(0, 80),
    aboutText: str(form, "aboutText").slice(0, 3000),
    contactEmail: str(form, "contactEmail").slice(0, 200) || null,
    contactPhone: str(form, "contactPhone").slice(0, 40) || null,
    contactAddress: str(form, "contactAddress").slice(0, 300) || null,
    stockAlertEmail: str(form, "stockAlertEmail").slice(0, 200) || null,
    instagramUrl: url("instagramUrl"),
    tiktokUrl: url("tiktokUrl"),
  };
  try {
    const hero = form.get("heroImage");
    if (hero instanceof File && hero.size > 0) data.heroImageUrl = await saveImage(hero, "site");
    if (bool(form, "removeHero")) data.heroImageUrl = null;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Échec de l'envoi de l'image." };
  }
  await prisma.shopSettings.update({ where: { id: 1 }, data });
  revalidateShop();
  return { ok: true, message: "Paramètres enregistrés." };
}

export async function moderateReview(form: FormData) {
  await requireAdmin();
  const status = str(form, "status");
  if (status === "DELETE") await prisma.review.delete({ where: { id: str(form, "id") } });
  else if (status === "APPROVED" || status === "REJECTED") await prisma.review.update({ where: { id: str(form, "id") }, data: { status } });
  revalidateShop();
}

export async function toggleMessageHandled(form: FormData) {
  await requireAdmin();
  const m = await prisma.contactMessage.findUnique({ where: { id: str(form, "id") } });
  if (m) await prisma.contactMessage.update({ where: { id: m.id }, data: { handled: !m.handled } });
  revalidatePath("/admin/messages");
}

export async function setUserRole(form: FormData) {
  const admin = await requireAdmin();
  const id = str(form, "id");
  if (id === admin.id) return; // on ne se retire pas soi-même les droits
  await prisma.user.update({ where: { id }, data: { role: str(form, "role") === "ADMIN" ? "ADMIN" : "CUSTOMER" } });
  revalidatePath("/admin/clients");
}
