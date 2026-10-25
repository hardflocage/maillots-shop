import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { renderMarkdown } from "@/lib/markdown";
import { fillPlaceholders, loadPlaceholderValues } from "@/lib/content";
import { getCurrentUser } from "@/lib/auth";
import { listProducts } from "@/lib/catalog";
import { formatDate, formatPrice } from "@/lib/format";
import { KIT_LABELS, sizeRank } from "@/lib/labels";
import { orderedImages, primaryImage } from "@/lib/products";
import { siteUrl } from "@/lib/settings";
import { ProductView } from "@/components/product/ProductView";
import { ProductRail } from "@/components/product/ProductRail";
import { IconStar } from "@/components/ui/Icons";

const getProduct = cache((slug: string) =>
  prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      images: true,
      variants: { orderBy: { sortOrder: "asc" } },
      players: { orderBy: { number: "asc" } },
      categories: { where: { isActive: true }, select: { id: true, name: true, slug: true } },
      reviews: { where: { status: "APPROVED" }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  }),
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const img = primaryImage(p.images);
  const description = `${p.name} : maillot ${KIT_LABELS[p.kitType].toLowerCase()} ${p.club} saison ${p.season}. ${p.customizationEnabled ? "Flocage nom et numéro disponible. " : ""}${formatPrice(p.price)}.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/maillot/${p.slug}` },
    openGraph: { title: p.name, description, images: img ? [{ url: img }] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  const [user, related, shipping, guide, placeholders] = await Promise.all([
    getCurrentUser(),
    listProducts(
      { id: { not: product.id }, OR: [{ club: product.club }, { categories: { some: { id: { in: product.categories.map((c) => c.id) } } } }] },
      { take: 8, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }] },
    ),
    prisma.shippingMethod.findFirst({ where: { isActive: true }, orderBy: { price: "asc" } }),
    prisma.page.findUnique({ where: { slug: "guide-des-tailles" } }),
    loadPlaceholderValues(),
  ]);
  const sizeGuideHtml = guide ? renderMarkdown(fillPlaceholders(guide.content, placeholders)) : null;
  const isFavorite = user ? Boolean(await prisma.favorite.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } })) : false;

  const images = orderedImages(product.images).map((i) => ({
    url: i.url,
    kind: i.kind,
    alt: i.alt || `${product.name} : ${i.kind === "FRONT" ? "devant" : i.kind === "BACK" ? "dos" : "détail"}`,
  }));
  const variants = [...product.variants].sort((a, b) => a.sortOrder - b.sortOrder || sizeRank(a.size) - sizeRank(b.size));
  const avg = product.reviews.length ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length : null;
  const inStock = variants.some((v) => v.stock > 0);
  const shippingNote = shipping
    ? `${shipping.name} : ${shipping.price === 0 ? "offerte" : formatPrice(shipping.price)}${shipping.freeOver != null ? `, offerte dès ${formatPrice(shipping.freeOver)} d'achat` : ""}${shipping.deliveryTime ? ` · ${shipping.deliveryTime}` : ""}.`
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images.map((i) => (i.url.startsWith("http") ? i.url : `${siteUrl()}${i.url}`)),
    description: product.description.slice(0, 500),
    brand: { "@type": "Brand", name: product.club },
    sku: product.id,
    offers: {
      "@type": "Offer",
      url: `${siteUrl()}/maillot/${product.slug}`,
      priceCurrency: "EUR",
      price: (product.price / 100).toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(avg ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: product.reviews.length } } : {}),
  };

  const header = (
    <div>
      <nav className="mb-4 text-xs uppercase tracking-[0.16em] text-bone-dim" aria-label="Fil d'Ariane">
        <Link href="/boutique" className="hover:text-bone">Boutique</Link>
        {product.categories[0] && <> <span className="mx-2">/</span><Link href={`/collections/${product.categories[0].slug}`} className="hover:text-bone">{product.categories[0].name}</Link></>}
      </nav>
      <div className="flex flex-wrap gap-2">
        {product.isNew && <span className="chip border-bone/40 text-bone">Nouveau</span>}
        {product.isDemo && <span className="chip">Produit de démonstration</span>}
      </div>
      <h1 className="h-display mt-3 text-4xl sm:text-5xl xl:text-6xl">{product.name}</h1>
      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-bone-muted">
        <div><dt className="inline text-bone-dim">Club : </dt><dd className="inline">{product.club}</dd></div>
        <div><dt className="inline text-bone-dim">Saison : </dt><dd className="inline">{product.season}</dd></div>
        <div><dt className="inline text-bone-dim">Type : </dt><dd className="inline">{KIT_LABELS[product.kitType]}</dd></div>
      </dl>
      {avg && (
        <a href="#avis" className="mt-3 flex items-center gap-2 text-sm text-bone-muted">
          <span className="flex text-gold">{Array.from({ length: 5 }).map((_, i) => <IconStar key={i} width={14} height={14} fill={i < Math.round(avg) ? "currentColor" : "none"} />)}</span>
          {avg.toFixed(1)} · {product.reviews.length} avis
        </a>
      )}
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-x pt-6 sm:pt-10">
        <ProductView
          header={header}
          isFavorite={isFavorite}
          loggedIn={Boolean(user)}
          shippingNote={shippingNote}
          sizeGuideHtml={sizeGuideHtml}
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            customizationEnabled: product.customizationEnabled,
            customizationPrice: product.customizationPrice,
            maxNameLength: product.maxNameLength,
            flockingColor: product.flockingColor,
            flockingTop: product.flockingTop,
            deliveryInfo: product.deliveryInfo,
            images,
            variants: variants.map((v) => ({ id: v.id, size: v.size, stock: v.stock, lowStockThreshold: v.lowStockThreshold })),
            players: product.players.map((p) => ({ id: p.id, name: p.name, number: p.number })),
          }}
        />

        <section className="mt-16 grid gap-10 border-t border-ink-600 pt-12 lg:grid-cols-2">
          <div>
            <h2 className="h-display mb-5 text-3xl">Description</h2>
            <div className="space-y-4 leading-relaxed text-bone-muted">
              {product.description.split(/\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
          <div>
            <h2 className="h-display mb-5 text-3xl">Détails</h2>
            <dl className="divide-y divide-ink-600 rounded-2xl border border-ink-600 text-sm">
              {[
                ["Club / sélection", product.club],
                ["Saison", product.season],
                ["Type", KIT_LABELS[product.kitType]],
                ["Tailles", variants.map((v) => v.size).join(", ")],
                ["Disponibilité", inStock ? `En stock (${variants.filter((v) => v.stock > 0).map((v) => v.size).join(", ")})` : "Rupture de stock"],
                ["Flocage", product.customizationEnabled ? `Disponible (+${formatPrice(product.customizationPrice)})` : "Non disponible"],
                ["Livraison", product.deliveryInfo || shippingNote || "Présentée avant le paiement"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 px-5 py-3.5"><dt className="text-bone-dim">{k}</dt><dd className="text-right text-bone">{v}</dd></div>
              ))}
            </dl>
          </div>
        </section>

        <section id="avis" className="mt-16 border-t border-ink-600 pt-12">
          <h2 className="h-display mb-6 text-3xl">Avis clients</h2>
          {product.reviews.length === 0 ? (
            <p className="text-bone-muted">Aucun avis pour le moment. Les avis sont publiés uniquement par des clients ayant reçu ce maillot.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {product.reviews.map((r) => (
                <article key={r.id} className="card p-5">
                  <div className="flex text-gold">{Array.from({ length: 5 }).map((_, i) => <IconStar key={i} width={14} height={14} fill={i < r.rating ? "currentColor" : "none"} />)}</div>
                  {r.title && <p className="mt-3 font-semibold">{r.title}</p>}
                  <p className="mt-1 text-sm leading-relaxed text-bone-muted">{r.body}</p>
                  <p className="mt-3 text-xs text-bone-dim">{r.user.name?.split(" ")[0] ?? "Client"} · Achat vérifié · {formatDate(r.createdAt)}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <ProductRail eyebrow="Dans le même esprit" title="Vous aimerez aussi" products={related} />
    </>
  );
}
