const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

/** Formate un montant en centimes : 8990 -> "89,90 €" */
export function formatPrice(cents: number) {
  return euro.format(cents / 100);
}

/** "89,90" ou "89.90" -> 8990 */
export function parsePrice(input: string | null | undefined): number | null {
  if (input == null) return null;
  const cleaned = String(input).replace(/\s|€/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function centsToInput(cents: number | null | undefined) {
  return cents == null ? "" : (cents / 100).toFixed(2).replace(".", ",");
}

export function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(d));
}

export function formatDateTime(d: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
