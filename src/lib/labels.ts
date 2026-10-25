import type { KitType, OrderStatus, ReturnStatus, CategoryType } from "@prisma/client";

export const KIT_LABELS: Record<KitType, string> = {
  HOME: "Domicile",
  AWAY: "Extérieur",
  THIRD: "Third",
  FOURTH: "Fourth",
  GOALKEEPER: "Gardien",
  SPECIAL: "Édition spéciale",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "En attente de paiement",
  PAID: "Payée",
  PREPARING: "En préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  EXPIRED: "Paiement non finalisé",
  REFUNDED: "Remboursée",
  PARTIALLY_REFUNDED: "Remboursée partiellement",
};

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  REQUESTED: "Demandé",
  APPROVED: "Accepté",
  REJECTED: "Refusé",
  REFUNDED: "Remboursé",
};

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  LEAGUE: "Championnat",
  NATIONAL: "Sélections nationales",
  RETRO: "Rétro",
  COMPETITION: "Compétition",
  SPECIAL: "Sélection spéciale",
};

/** Ordre d'affichage des tailles */
export const SIZE_ORDER = ["4 ans", "6 ans", "8 ans", "10 ans", "12 ans", "14 ans", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

export function sizeRank(size: string) {
  const i = SIZE_ORDER.indexOf(size);
  return i === -1 ? 100 : i;
}
