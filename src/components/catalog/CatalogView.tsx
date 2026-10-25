import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { productCardInclude } from "@/lib/products";
import { parsePrice } from "@/lib/format";
import { sizeRank } from "@/lib/labels";
import { ProductCard } from "@/components/product/ProductCard";
import { CatalogFilters } from "./CatalogFilters";

export type SearchParams = Record<string, string | string[] | undefined>;
const PER_PAGE = 24;

function one(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v)?.slice(0, 80) ?? "";
}

export async function CatalogView({ searchParams, category }: { searchParams: SearchParams; category?: { id: string; slug: string; name: string; description: string | null } }) {
  const q = one(searchParams.q).trim();
  const cat = category?.slug ?? one(searchParams.categorie);
  const club = one(searchParams.club);
  const season = one(searchParams.saison);
  const size = one(searchParams.taille);
  const min = parsePrice(one(searchParams.min));
  const max = parsePrice(one(searchParams.max));
  const inStock = one(searchParams.dispo) === "1";
  const promo = one(searchParams.promo) === "1";
  const trending = one(searchParams.tendance) === "1";
  const sort = one(searchParams.tri) || "pertinence";
  const page = Math.max(1, Number(one(searchParams.page)) || 1);

  const and: Prisma.ProductWhereInput[] = [{ isActive: true }];
  if (q) {
    const contains = { contains: q, mode: "insensitive" as const };
    and.push({ OR: [{ name: contains }, { club: contains }, { season: contains }, { description: contains }, { players: { some: { name: contains } } }, { categories: { some: { name: contains } } }] });
  }
  if (cat) and.push({ categories: { some: { slug: cat } } });
  if (club) and.push({ club });
  if (season) and.push({ season });
  if (size) and.push({ variants: { some: { size, ...(inStock ? { stock: { gt: 0 } } : {}) } } });
  else if (inStock) and.push({ variants: { some: { stock: { gt: 0 } } } });
  if (min != null) and.push({ price: { gte: min } });
  if (max != null) and.push({ price: { lte: max } });
  if (trending) and.push({ isFeatured: true });
  if (promo) and.push({ compareAtPrice: { gt: prisma.product.fields.price } });
  const where: Prisma.ProductWhereInput = { AND: and };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "prix-asc" ? [{ price: "asc" }] :
    sort === "prix-desc" ? [{ price: "desc" }] :
    sort === "ventes" ? [{ orderItems: { _count: "desc" } }, { createdAt: "desc" }] :
    sort === "nouveautes" ? [{ isNew: "desc" }, { createdAt: "desc" }] :
    [{ isFeatured: "desc" }, { createdAt: "desc" }];

  const baseWhere: Prisma.ProductWhereInput = { isActive: true, ...(category ? { categories: { some: { id: category.id } } } : {}) };
  const [products, total, clubs, seasons, sizes, categories] = await Promise.all([
    prisma.product.findMany({ where, include: productCardInclude, orderBy, take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    prisma.product.count({ where }),
    prisma.product.findMany({ where: baseWhere, distinct: ["club"], select: { club: true }, orderBy: { club: "asc" } }),
    prisma.product.findMany({ where: baseWhere, distinct: ["season"], select: { season: true }, orderBy: { season: "desc" } }),
    prisma.variant.findMany({ where: { product: baseWhere }, distinct: ["size"], select: { size: true } }),
    category ? Promise.resolve([]) : prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
  ]);

  const title = category?.name ?? (q ? `Résultats pour « ${q} »` : promo ? "Promotions" : sort === "nouveautes" ? "Nouveautés" : trending ? "Tendances" : "Tous les maillots");
  const pages = Math.ceil(total / PER_PAGE);
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (typeof v === "string" && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `?${s}` : "?";
  };

  return (
    <div className="container-x pb-10 pt-10 sm:pt-14">
      <nav className="mb-6 text-xs uppercase tracking-[0.16em] text-bone-dim" aria-label="Fil d'Ariane">
        <Link href="/" className="hover:text-bone">Accueil</Link> <span className="mx-2">/</span>
        {category ? <><Link href="/boutique" className="hover:text-bone">Boutique</Link> <span className="mx-2">/</span><span className="text-bone-muted">{category.name}</span></> : <span className="text-bone-muted">Boutique</span>}
      </nav>
      <div className="mb-8 flex flex-col gap-3 sm:mb-12">
        <h1 className="h-display text-5xl sm:text-7xl">{title}</h1>
        {category?.description && <p className="max-w-2xl text-bone-muted">{category.description}</p>}
        <p className="text-sm text-bone-dim">{total} maillot{total > 1 ? "s" : ""}</p>
      </div>

      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
        <CatalogFilters
          categories={categories}
          clubs={clubs.map((c) => c.club)}
          seasons={seasons.map((s) => s.season)}
          sizes={sizes.map((s) => s.size).sort((a, b) => sizeRank(a) - sizeRank(b))}
          fixedCategory={Boolean(category)}
        />
        <div>
          {products.length === 0 ? (
            <div className="card flex flex-col items-center gap-4 px-6 py-20 text-center">
              <p className="text-lg">Aucun maillot ne correspond à ces critères.</p>
              <Link href={category ? `/collections/${category.slug}` : "/boutique"} className="btn-ghost">Réinitialiser les filtres</Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
              {products.map((p, i) => <li key={p.id}><ProductCard product={p} priority={i < 4} /></li>)}
            </ul>
          )}
          {pages > 1 && (
            <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={pageHref(p)} aria-current={p === page ? "page" : undefined} className={`flex h-11 min-w-11 items-center justify-center rounded-full border px-3 text-sm ${p === page ? "border-gold bg-gold text-ink" : "border-ink-500 text-bone-muted hover:text-bone"}`}>{p}</Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
