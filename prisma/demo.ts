/**
 * Produits de DÉMONSTRATION (marqués "Démo" sur le site) pour tester la boutique
 * avant d'ajouter vos vrais maillots. Suppression en un clic : Administration > Produits.
 */
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { PrismaClient, type KitType } from "@prisma/client";
import { jerseySvg, type JerseySpec } from "./jersey-svg";

const prisma = new PrismaClient();

type Demo = {
  slug: string; name: string; club: string; season: string; kit: KitType; price: number; compareAt?: number;
  cats: string[]; spec: JerseySpec; isNew?: boolean; featured?: boolean; custom?: boolean; players?: [string, number][];
  stock: Record<string, number>; flockingColor?: string;
};

const ADULT = (n: number[]) => Object.fromEntries(["S", "M", "L", "XL", "XXL", "3XL"].map((s, i) => [s, n[i] ?? 0]));

const demos: Demo[] = [
  { slug: "real-madrid-domicile-2025-26", name: "Real Madrid Domicile 2025/26", club: "Real Madrid", season: "2025/26", kit: "HOME", price: 8990, cats: ["liga", "ligue-des-champions"], spec: { base: "#F4F4F0", accent: "#E9E6DA", trim: "#C9A74A", pattern: "plain" }, isNew: true, featured: true, players: [["MBAPPÉ", 9], ["BELLINGHAM", 5], ["VINI JR.", 7]], stock: { ...ADULT([4, 5, 3, 2, 1, 0]) }, flockingColor: "#1B1B1F" },
  { slug: "psg-domicile-2025-26", name: "Paris Domicile 2025/26", club: "Paris Saint-Germain", season: "2025/26", kit: "HOME", price: 8990, cats: ["ligue-1", "ligue-des-champions"], spec: { base: "#0E1C3D", accent: "#D7263D", trim: "#FFFFFF", pattern: "halves" }, isNew: true, featured: true, players: [["DEMBÉLÉ", 10], ["HAKIMI", 2], ["VITINHA", 17]], stock: ADULT([3, 6, 6, 4, 2, 1]) },
  { slug: "barcelone-domicile-2025-26", name: "Barcelone Domicile 2025/26", club: "FC Barcelone", season: "2025/26", kit: "HOME", price: 8990, compareAt: 9990, cats: ["liga"], spec: { base: "#A50044", accent: "#004D98", trim: "#EDBB00", pattern: "stripes" }, featured: true, players: [["YAMAL", 10], ["PEDRI", 8], ["LEWANDOWSKI", 9]], stock: ADULT([2, 4, 4, 3, 1, 0]), flockingColor: "#EDBB00" },
  { slug: "om-domicile-2025-26", name: "Marseille Domicile 2025/26", club: "Olympique de Marseille", season: "2025/26", kit: "HOME", price: 8490, cats: ["ligue-1"], spec: { base: "#FFFFFF", accent: "#2FAEE0", trim: "#2FAEE0", pattern: "plain" }, isNew: true, stock: ADULT([3, 3, 3, 2, 2, 0]), flockingColor: "#2FAEE0" },
  { slug: "liverpool-exterieur-2025-26", name: "Liverpool Extérieur 2025/26", club: "Liverpool", season: "2025/26", kit: "AWAY", price: 8990, cats: ["premier-league"], spec: { base: "#F2EFE6", accent: "#1C1C1C", trim: "#C8102E", pattern: "pinstripes" }, stock: ADULT([1, 2, 2, 1, 0, 0]), flockingColor: "#C8102E" },
  { slug: "manchester-city-third-2025-26", name: "Manchester City Third 2025/26", club: "Manchester City", season: "2025/26", kit: "THIRD", price: 8990, compareAt: 10490, cats: ["premier-league"], spec: { base: "#1E1B3A", accent: "#6CABDD", trim: "#6CABDD", pattern: "sash" }, stock: ADULT([2, 3, 3, 2, 1, 1]) },
  { slug: "inter-domicile-2025-26", name: "Inter Domicile 2025/26", club: "Inter Milan", season: "2025/26", kit: "HOME", price: 8990, cats: ["serie-a"], spec: { base: "#0A2A6B", accent: "#111111", trim: "#C9A74A", pattern: "stripes" }, isNew: true, stock: ADULT([2, 3, 4, 2, 0, 0]) },
  { slug: "bayern-domicile-2025-26", name: "Bayern Domicile 2025/26", club: "Bayern Munich", season: "2025/26", kit: "HOME", price: 8990, cats: ["bundesliga", "ligue-des-champions"], spec: { base: "#DC052D", accent: "#B00424", trim: "#FFFFFF", pattern: "plain" }, players: [["KANE", 9], ["MUSIALA", 42]], stock: ADULT([2, 4, 4, 3, 2, 0]) },
  { slug: "france-domicile-2026", name: "France Domicile 2026", club: "France", season: "2026", kit: "HOME", price: 9490, cats: ["selections-nationales"], spec: { base: "#1A2A57", accent: "#16234A", trim: "#E1000F", pattern: "plain" }, isNew: true, featured: true, players: [["MBAPPÉ", 10], ["TCHOUAMÉNI", 8]], stock: ADULT([5, 8, 8, 5, 3, 2]) },
  { slug: "argentine-domicile-2026", name: "Argentine Domicile 2026", club: "Argentine", season: "2026", kit: "HOME", price: 9490, cats: ["selections-nationales"], spec: { base: "#FFFFFF", accent: "#75AADB", trim: "#1C1C1C", pattern: "stripes" }, players: [["MESSI", 10]], stock: ADULT([3, 4, 4, 2, 1, 0]), flockingColor: "#1C1C1C" },
  { slug: "france-retro-1998", name: "France Rétro 1998", club: "France", season: "1998", kit: "HOME", price: 7990, cats: ["selections-nationales", "retro"], spec: { base: "#1F3A8A", accent: "#E1000F", trim: "#FFFFFF", pattern: "plain", retro: true }, players: [["ZIDANE", 10], ["DESCHAMPS", 7]], stock: ADULT([2, 3, 3, 2, 1, 0]) },
  { slug: "milan-retro-1989", name: "Milan Rétro 1989", club: "AC Milan", season: "1988/89", kit: "HOME", price: 7990, compareAt: 8990, cats: ["serie-a", "retro"], spec: { base: "#C8102E", accent: "#111111", trim: "#FFFFFF", pattern: "stripes", retro: true }, stock: ADULT([1, 2, 2, 1, 0, 0]), custom: false },
  { slug: "ajax-retro-1995", name: "Ajax Rétro 1995", club: "Ajax", season: "1994/95", kit: "HOME", price: 7990, cats: ["retro"], spec: { base: "#FFFFFF", accent: "#D2122E", trim: "#D2122E", pattern: "halves", retro: true }, stock: ADULT([0, 2, 1, 1, 0, 0]), custom: false, flockingColor: "#1C1C1C" },
];

async function main() {
  const dir = path.join(process.cwd(), "public", "demo");
  mkdirSync(dir, { recursive: true });
  const cats = await prisma.category.findMany();
  if (cats.length === 0) throw new Error("Lancez d'abord : npm run db:seed");

  for (const d of demos) {
    writeFileSync(path.join(dir, `${d.slug}-front.svg`), jerseySvg(d.spec, "front"));
    writeFileSync(path.join(dir, `${d.slug}-back.svg`), jerseySvg(d.spec, "back"));
    if (await prisma.product.findUnique({ where: { slug: d.slug } })) continue;
    await prisma.product.create({
      data: {
        slug: d.slug, name: d.name, club: d.club, season: d.season, kitType: d.kit, price: d.price, compareAtPrice: d.compareAt ?? null,
        isDemo: true, isNew: d.isNew ?? false, isFeatured: d.featured ?? false, customizationEnabled: d.custom ?? true,
        flockingColor: d.flockingColor ?? "#FFFFFF",
        description: `Produit de démonstration. Remplacez ce texte par la description réelle du maillot ${d.club} ${d.season} : matière, coupe, détails, entretien.`,
        categories: { connect: d.cats.map((slug) => ({ slug })) },
        images: { create: [
          { url: `/demo/${d.slug}-front.svg`, kind: "FRONT", alt: `${d.name} devant`, sortOrder: 0 },
          { url: `/demo/${d.slug}-back.svg`, kind: "BACK", alt: `${d.name} dos`, sortOrder: 1 },
        ] },
        variants: { create: Object.entries(d.stock).map(([size, stock], i) => ({ size, stock, sortOrder: i })) },
        players: { create: (d.players ?? []).map(([name, number]) => ({ name, number })) },
      },
    });
  }
  if ((await prisma.promoCode.count()) === 0) await prisma.promoCode.create({ data: { code: "DEMO10", type: "PERCENT", value: 10 } });
  console.log(`✓ ${demos.length} produits de démonstration prêts (+ code promo DEMO10).`);
}

main().finally(() => prisma.$disconnect());
