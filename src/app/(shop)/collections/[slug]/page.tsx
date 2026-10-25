import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CatalogView, type SearchParams } from "@/components/catalog/CatalogView";

async function getCategory(slug: string) {
  return prisma.category.findFirst({ where: { slug, isActive: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCategory((await params).slug);
  if (!c) return {};
  return { title: `Maillots ${c.name}`, description: c.description ?? `Tous nos maillots ${c.name} : flocage personnalisé, paiement sécurisé.`, alternates: { canonical: `/collections/${c.slug}` } };
}

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> }) {
  const category = await getCategory((await params).slug);
  if (!category) notFound();
  return <Suspense><CatalogView category={category} searchParams={await searchParams} /></Suspense>;
}
