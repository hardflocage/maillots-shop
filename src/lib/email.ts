import "server-only";
import { formatPrice } from "./format";
import { siteUrl } from "./settings";
import { prisma } from "./prisma";

type Mail = { to: string; subject: string; html: string; replyTo?: string };

/**
 * Envoi via l'API Resend. Sans RESEND_API_KEY, l'e-mail N'EST PAS envoyé :
 * il est seulement journalisé côté serveur (et l'administration l'indique).
 */
export async function sendEmail(mail: Mail): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.info(`[email non envoyé : Resend non configuré] à=${mail.to} sujet="${mail.subject}"`);
    return { sent: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, html: mail.html, reply_to: mail.replyTo }),
    });
    if (!res.ok) {
      console.error(`[email] échec ${res.status}: ${await res.text()}`);
      return { sent: false };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] erreur réseau", e);
    return { sent: false };
  }
}

async function shopName() {
  return (await prisma.shopSettings.findUnique({ where: { id: 1 } }))?.shopName ?? "MAILLOT";
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function layout(shop: string, title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#0b0b0c;font-family:Helvetica,Arial,sans-serif;color:#f5f5f2">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#141417;border:1px solid #2e2e34;border-radius:16px">
<tr><td style="padding:28px 32px;border-bottom:1px solid #2e2e34;font-size:22px;letter-spacing:4px;font-weight:bold;color:#d6b36a">${esc(shop)}</td></tr>
<tr><td style="padding:32px"><h1 style="margin:0 0 16px;font-size:22px;color:#fff">${esc(title)}</h1>${body}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #2e2e34;font-size:12px;color:#8a8a92">${esc(shop)} · <a href="${siteUrl()}" style="color:#8a8a92">${siteUrl().replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const p = (s: string) => `<p style="margin:0 0 14px;line-height:1.6;color:#d4d4d8">${s}</p>`;
const btn = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#d6b36a;color:#0b0b0c;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:bold">${esc(label)}</a></p>`;

type OrderForMail = Awaited<ReturnType<typeof loadOrder>>;

async function loadOrder(orderId: string) {
  return prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
}

function itemsTable(order: NonNullable<OrderForMail>) {
  const rows = order.items
    .map((i) => {
      const flock = i.customizationName ? `<br><span style="color:#a6a6ad;font-size:13px">Flocage : ${esc(i.customizationName)} · ${i.customizationNumber}</span>` : "";
      return `<tr><td style="padding:10px 0;border-bottom:1px solid #2e2e34;color:#f5f5f2">${esc(i.productName)} — ${esc(i.size)} × ${i.quantity}${flock}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #2e2e34;color:#f5f5f2">${formatPrice((i.unitPrice + i.customizationPrice) * i.quantity)}</td></tr>`;
    })
    .join("");
  const line = (label: string, v: string) => `<tr><td style="padding:6px 0;color:#a6a6ad">${label}</td><td align="right" style="padding:6px 0;color:#f5f5f2">${v}</td></tr>`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px">${rows}
${line("Sous-total", formatPrice(order.subtotal))}
${order.discountTotal ? line(esc(order.discountLabel ?? "Réductions"), "−" + formatPrice(order.discountTotal)) : ""}
${line(`Livraison (${esc(order.shippingMethodName)})`, order.shippingCost ? formatPrice(order.shippingCost) : "Offerte")}
<tr><td style="padding:10px 0;font-weight:bold;color:#fff">Total payé</td><td align="right" style="padding:10px 0;font-weight:bold;color:#fff">${formatPrice(order.total)}</td></tr></table>`;
}

function trackingLink(order: { number: string; email: string }) {
  return `${siteUrl()}/suivi?commande=${encodeURIComponent(order.number)}&email=${encodeURIComponent(order.email)}`;
}

export async function sendOrderConfirmation(orderId: string) {
  const order = await loadOrder(orderId);
  const shop = await shopName();
  const body =
    p(`Bonjour ${esc(order.firstName)}, merci pour ta commande ! Ton paiement a bien été validé.`) +
    p(`Commande <strong>${order.number}</strong>`) +
    itemsTable(order) +
    p(`Livraison à : ${esc(order.firstName)} ${esc(order.lastName)}, ${esc(order.line1)}${order.line2 ? ", " + esc(order.line2) : ""}, ${esc(order.postalCode)} ${esc(order.city)}`) +
    btn(trackingLink(order), "Suivre ma commande");
  return sendEmail({ to: order.email, subject: `Commande ${order.number} confirmée`, html: layout(shop, "Commande confirmée", body) });
}

export async function sendShippingNotification(orderId: string) {
  const order = await loadOrder(orderId);
  const shop = await shopName();
  const tracking = order.trackingNumber
    ? p(`Transporteur : <strong>${esc(order.carrier ?? "—")}</strong><br>Numéro de suivi : <strong>${esc(order.trackingNumber)}</strong>`) +
      (order.trackingUrl ? btn(order.trackingUrl, "Suivre le colis") : "")
    : "";
  const body = p(`Bonne nouvelle ${esc(order.firstName)}, ta commande <strong>${order.number}</strong> vient d'être expédiée.`) + tracking + btn(trackingLink(order), "Voir ma commande");
  return sendEmail({ to: order.email, subject: `Commande ${order.number} expédiée`, html: layout(shop, "Ta commande est en route", body) });
}

export async function sendDeliveredNotification(orderId: string) {
  const order = await loadOrder(orderId);
  const shop = await shopName();
  const body = p(`Ta commande <strong>${order.number}</strong> est indiquée comme livrée. Nous espérons que ton maillot te plaît !`) + p("Tu peux laisser un avis depuis ton espace client si tu as un compte.");
  return sendEmail({ to: order.email, subject: `Commande ${order.number} livrée`, html: layout(shop, "Commande livrée", body) });
}

export async function sendRefundNotification(orderId: string, amount: number) {
  const order = await loadOrder(orderId);
  const shop = await shopName();
  const body = p(`Un remboursement de <strong>${formatPrice(amount)}</strong> a été effectué pour ta commande <strong>${order.number}</strong>.`) + p("Il apparaîtra sur ton relevé sous 5 à 10 jours ouvrés selon ta banque.");
  return sendEmail({ to: order.email, subject: `Remboursement commande ${order.number}`, html: layout(shop, "Remboursement effectué", body) });
}

export async function sendPasswordReset(to: string, link: string) {
  const shop = await shopName();
  const body = p("Tu as demandé à réinitialiser ton mot de passe. Ce lien est valable 1 heure.") + btn(link, "Choisir un nouveau mot de passe") + p("Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.");
  return sendEmail({ to, subject: "Réinitialisation du mot de passe", html: layout(shop, "Mot de passe oublié", body) });
}

export async function sendAbandonedCartReminder(orderId: string) {
  const order = await loadOrder(orderId);
  const shop = await shopName();
  const body = p(`Bonjour ${esc(order.firstName)}, ta commande n'a pas été finalisée. Les articles ne sont plus réservés, mais tu peux reprendre ton panier quand tu veux.`) + itemsTable(order) + btn(`${siteUrl()}/panier`, "Retourner à la boutique") + p(`<span style="font-size:12px;color:#8a8a92">Tu reçois cet e-mail car tu as accepté les rappels lors de ta commande. Il n'y aura pas d'autre relance.</span>`);
  return sendEmail({ to: order.email, subject: "Ton panier t'attend", html: layout(shop, "Tu as oublié quelque chose ?", body) });
}

export async function sendAdminNotification(subject: string, htmlBody: string, replyTo?: string) {
  const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } });
  const to = settings?.stockAlertEmail || settings?.contactEmail;
  if (!to) {
    console.info(`[email admin non envoyé : aucune adresse configurée] ${subject}`);
    return { sent: false };
  }
  return sendEmail({ to, subject, html: layout(settings?.shopName ?? "MAILLOT", subject, htmlBody), replyTo });
}

export { esc as escapeHtml, p as emailParagraph };
