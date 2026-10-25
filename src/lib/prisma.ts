import { PrismaClient } from "@prisma/client";

// DATABASE_URL en priorité ; sinon l'URL fournie par l'intégration Supabase ↔ Vercel,
// complétée pour viser l'espace « maillots » à travers le pooler.
function databaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const raw = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  if (!raw) return undefined;
  const url = new URL(raw);
  if (!url.searchParams.has("schema")) url.searchParams.set("schema", "maillots");
  if (url.port === "6543" && !url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
  return url.toString();
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const datasourceUrl = databaseUrl();
export const prisma = globalForPrisma.prisma ?? new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
