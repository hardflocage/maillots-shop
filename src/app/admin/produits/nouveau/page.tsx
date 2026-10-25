import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageTitle } from "@/components/admin/ui";

export default async function NewProduct() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="max-w-4xl">
      <Link href="/admin/produits" className="text-sm text-bone-muted hover:text-bone">← Produits</Link>
      <PageTitle title="Nouveau maillot" />
      <ProductForm categories={categories} />
    </div>
  );
}
