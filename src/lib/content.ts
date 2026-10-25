import "server-only";
import type { ShippingMethod, ShopSettings } from "@prisma/client";
import { prisma } from "./prisma";
import { getSettings } from "./settings";
import { formatPrice } from "./format";

export const PLACEHOLDERS: { key: string; label: string }[] = [
  { key: "boutique", label: "Nom de la boutique" },
  { key: "raison_sociale", label: "Raison sociale" },
  { key: "forme_juridique", label: "Forme juridique" },
  { key: "adresse_siege", label: "Adresse du siège" },
  { key: "siret", label: "SIRET" },
  { key: "tva", label: "N° de TVA" },
  { key: "directeur_publication", label: "Directeur de la publication" },
  { key: "hebergeur", label: "Hébergeur" },
  { key: "mediateur", label: "Médiateur de la consommation" },
  { key: "email", label: "E-mail de contact" },
  { key: "telephone", label: "Téléphone" },
  { key: "delai_retour", label: "Délai de retour" },
  { key: "adresse_retour", label: "Adresse de retour" },
  { key: "livraison", label: "Modes de livraison (automatique)" },
  { key: "a_propos", label: "Texte « À propos »" },
];

export function shippingSummary(methods: Pick<ShippingMethod, "name" | "description" | "price" | "freeOver" | "deliveryTime">[]) {
  if (methods.length === 0) return "";
  return methods
    .map((m) => {
      const price = m.price === 0 ? "offerte" : formatPrice(m.price);
      const free = m.freeOver != null && m.price > 0 ? `, offerte dès ${formatPrice(m.freeOver)} d'achat` : "";
      const delay = m.deliveryTime ? ` Délai indiqué par le transporteur : ${m.deliveryTime}.` : "";
      const desc = m.description ? ` ${m.description}` : "";
      return `- **${m.name}** : ${price}${free}.${desc}${delay}`;
    })
    .join("\n");
}

export function placeholderValues(s: ShopSettings, methods: Parameters<typeof shippingSummary>[0]): Record<string, string> {
  return {
    boutique: s.shopName,
    raison_sociale: s.legalName ?? "",
    forme_juridique: s.legalForm ?? "",
    adresse_siege: s.legalAddress ?? "",
    siret: s.siret ?? "",
    tva: s.vatNumber ?? "",
    directeur_publication: s.publicationDirector ?? "",
    hebergeur: s.hostInfo,
    mediateur: s.mediator ?? "",
    email: s.contactEmail ?? "",
    telephone: s.contactPhone ?? "",
    delai_retour: String(s.returnDays),
    adresse_retour: s.returnAddress ?? "",
    livraison: shippingSummary(methods),
    a_propos: s.aboutText.trim(),
  };
}

const TOKEN = /\{\{\s*([a-z_]+)\s*\}\}/g;

/**
 * Remplace les balises {{...}}. Un bloc (ligne ou paragraphe) contenant une balise vide
 * est retiré : on n'affiche jamais d'information provisoire ou inventée.
 */
export function fillPlaceholders(content: string, values: Record<string, string>) {
  return content
    .split(/\n/)
    .filter((line) => {
      for (const m of line.matchAll(TOKEN)) if (!(values[m[1]] ?? "").trim()) return false;
      return true;
    })
    .join("\n")
    .replace(TOKEN, (_, k: string) => values[k] ?? "")
    .replace(/(^|\n)## [^\n]+\n(?=\s*(\n## |$))/g, "$1"); // titre de section resté vide
}

export function missingPlaceholders(content: string, values: Record<string, string>) {
  const missing = new Set<string>();
  for (const m of content.matchAll(TOKEN)) if (!(values[m[1]] ?? "").trim()) missing.add(m[1]);
  return [...missing];
}

export async function loadPlaceholderValues() {
  const [settings, methods] = await Promise.all([
    getSettings(),
    prisma.shippingMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return placeholderValues(settings, methods);
}

/** Moyens de paiement à afficher : uniquement ceux déclarés actifs, et seulement si Stripe est branché. */
export function activePaymentMethods(s: Pick<ShopSettings, "payCard" | "payApplePay" | "payGooglePay" | "payPaypal">) {
  if (!process.env.STRIPE_SECRET_KEY) return [];
  return [
    s.payCard && "Carte bancaire",
    s.payApplePay && "Apple Pay",
    s.payGooglePay && "Google Pay",
    s.payPaypal && "PayPal",
  ].filter(Boolean) as string[];
}
