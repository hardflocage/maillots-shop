import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { orderedImages } from "@/lib/products";
import { deleteProduct, deleteProductImage, setImageKind } from "@/app/actions/admin";
import { ProductForm } from "@/components/admin/ProductForm";
import { ConfirmButton } from "@/components/admin/ActionForm";
import { Alert, PageTitle } from "@/components/admin/ui";

const KIND = { FRONT: "Devant", BACK: "Dos", EXTRA: "Supplémentaire" } as const;

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ cree?: string }> }) {
  const [{ id }, { cree }] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { variants: { orderBy: { sortOrder: "asc" } }, players: true, categories: { select: { id: true } }, images: true, _count: { select: { orderItems: true } } } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();
  const images = orderedImages(product.images);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <Link href="/admin/produits" className="text-sm text-bone-muted hover:text-bone">← Produits</Link>
        <PageTitle title={product.name}>
          <Link href={`/maillot/${product.slug}`} target="_blank" className="btn-ghost">{product.isActive ? "Voir sur le site ↗" : "Aperçu (hors ligne) ↗"}</Link>
        </PageTitle>
        {cree && <Alert tone="ok">Produit créé. Vérifiez les photos devant et dos ci-dessous.</Alert>}
        {product.isDemo && <Alert tone="info">Produit de démonstration : enregistrez-le pour le transformer en vrai produit, ou supprimez-le.</Alert>}
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-semibold">Photos actuelles</h2>
        {images.length === 0 ? <p className="text-sm text-bone-muted">Aucune photo. Ajoutez au moins la photo devant et la photo dos.</p> : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {images.map((img) => (
              <li key={img.id} className="space-y-2">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink-700">
                  <Image src={img.url} alt="" fill sizes="200px" className="object-cover" unoptimized={img.url.endsWith(".svg")} />
                  <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${img.kind === "EXTRA" ? "bg-ink/70 text-bone" : "bg-gold text-ink"}`}>{KIND[img.kind]}</span>
                </div>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {(["FRONT", "BACK", "EXTRA"] as const).filter((k) => k !== img.kind).map((k) => (
                    <form key={k} action={setImageKind}><input type="hidden" name="imageId" value={img.id} /><input type="hidden" name="kind" value={k} /><button className="rounded-full border border-ink-500 px-2 py-1 text-bone-muted hover:text-bone">→ {KIND[k]}</button></form>
                  ))}
                  <form action={deleteProductImage}><input type="hidden" name="imageId" value={img.id} /><ConfirmButton message="Supprimer cette photo ?" className="rounded-full border border-signal/40 px-2 py-1 text-signal">Supprimer</ConfirmButton></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProductForm product={product} categories={categories} />

      <section className="card border-signal/30 p-5 sm:p-6">
        <h2 className="mb-2 font-semibold text-signal">Supprimer ce produit</h2>
        <p className="mb-4 text-sm text-bone-muted">{product._count.orderItems > 0 ? "Ce produit figure dans des commandes : il sera masqué de la boutique (l'historique est conservé)." : "Le produit et ses photos seront définitivement supprimés."}</p>
        <form action={deleteProduct}><input type="hidden" name="id" value={product.id} /><ConfirmButton message="Confirmer la suppression ?" className="btn-danger">Supprimer</ConfirmButton></form>
      </section>
    </div>
  );
}
