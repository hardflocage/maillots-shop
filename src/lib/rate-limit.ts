import "server-only";
import { headers } from "next/headers";

const buckets = new Map<string, { count: number; reset: number }>();

/**
 * Limiteur simple en mémoire (par instance serveur). Suffisant contre les abus basiques
 * (force brute sur la connexion, spam du formulaire de contact).
 */
export async function rateLimit(name: string, limit: number, windowMs: number) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const key = `${name}:${ip}`;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count++;
  if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  return b.count <= limit;
}
