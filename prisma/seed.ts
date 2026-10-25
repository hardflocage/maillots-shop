/**
 * Données de base INDISPENSABLES (sans produits) : paramètres, catégories, livraison, pages légales (remplies depuis les paramètres).
 * Sans danger à relancer : n'écrase pas ce que vous avez modifié.
 */
import { PrismaClient, type CategoryType } from "@prisma/client";
import { DEFAULT_PAGES } from "../src/lib/default-pages";

const prisma = new PrismaClient();

const categories: { name: string; slug: string; type: CategoryType; sortOrder: number }[] = [
  { name: "Ligue 1", slug: "ligue-1", type: "LEAGUE", sortOrder: 1 },
  { name: "Premier League", slug: "premier-league", type: "LEAGUE", sortOrder: 2 },
  { name: "Liga", slug: "liga", type: "LEAGUE", sortOrder: 3 },
  { name: "Serie A", slug: "serie-a", type: "LEAGUE", sortOrder: 4 },
  { name: "Bundesliga", slug: "bundesliga", type: "LEAGUE", sortOrder: 5 },
  { name: "Ligue des champions", slug: "ligue-des-champions", type: "COMPETITION", sortOrder: 6 },
  { name: "Sélections nationales", slug: "selections-nationales", type: "NATIONAL", sortOrder: 7 },
  { name: "Maillots rétro", slug: "retro", type: "RETRO", sortOrder: 8 },
];

const pages = DEFAULT_PAGES;

async function main() {
  await prisma.shopSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  for (const c of categories) await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  for (const p of pages) {
    const existing = await prisma.page.findUnique({ where: { slug: p.slug } });
    if (!existing) await prisma.page.create({ data: p });
    // Ancienne version avec textes provisoires jamais modifiés : remplacée par la version à balises
    else if (existing.content.includes("[À COMPLÉTER]")) await prisma.page.update({ where: { slug: p.slug }, data: { content: p.content } });
  }

  if ((await prisma.shippingMethod.count()) === 0) {
    await prisma.shippingMethod.createMany({
      data: [
        { name: "Livraison à domicile", description: "Colis suivi remis en main propre ou en boîte aux lettres.", type: "HOME", price: 490, freeOver: 7000, sortOrder: 1 },
        { name: "Point relais", description: "À activer quand votre transporteur point relais est configuré.", type: "RELAY", price: 390, freeOver: 7000, sortOrder: 2, isActive: false },
      ],
    });
  }
  if ((await prisma.autoDiscount.count()) === 0) {
    await prisma.autoDiscount.create({ data: { name: "Offre 2 maillots", minQuantity: 2, percentOff: 10, isActive: false } });
  }
  console.log("✓ Données de base en place (paramètres, catégories, livraison, pages).");
}

main().finally(() => prisma.$disconnect());
