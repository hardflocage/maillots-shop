import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView, type SearchParams } from "@/components/catalog/CatalogView";

export const metadata: Metadata = {
  title: "Boutique : tous les maillots",
  description: "Maillots de football de clubs, sélections nationales et rétro. Flocage personnalisé, paiement sécurisé.",
  alternates: { canonical: "/boutique" },
};

export default async function BoutiquePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <Suspense><CatalogView searchParams={await searchParams} /></Suspense>;
}
