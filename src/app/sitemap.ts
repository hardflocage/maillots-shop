import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories, pages] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.page.findMany({ select: { slug: true, updatedAt: true } }),
  ]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/boutique`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${base}/collections/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/maillot/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...pages.filter((p) => !["faq", "guide-des-tailles"].includes(p.slug)).map((p) => ({ url: `${base}/pages/${p.slug}`, lastModified: p.updatedAt, priority: 0.3 })),
    { url: `${base}/faq`, priority: 0.4 },
    { url: `${base}/guide-des-tailles`, priority: 0.4 },
    { url: `${base}/contact`, priority: 0.3 },
  ];
}
