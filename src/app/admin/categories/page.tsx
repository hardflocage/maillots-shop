import { prisma } from "@/lib/prisma";
import { deleteCategory, saveCategory } from "@/app/actions/admin";
import { CATEGORY_TYPE_LABELS } from "@/lib/labels";
import { ActionForm, ConfirmButton } from "@/components/admin/ActionForm";
import { Check, Field, PageTitle } from "@/components/admin/ui";
import type { Category } from "@prisma/client";

function CategoryFields({ c }: { c?: Category }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Nom"><input name="name" required defaultValue={c?.name} className="input" /></Field>
      <Field label="Slug (adresse)"><input name="slug" defaultValue={c?.slug} className="input" placeholder="auto" /></Field>
      <Field label="Type">
        <select name="type" defaultValue={c?.type ?? "LEAGUE"} className="input">
          {Object.entries(CATEGORY_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </Field>
      <Field label="Ordre"><input name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} className="input" /></Field>
      <Field label="Description (SEO)" className="sm:col-span-4"><input name="description" defaultValue={c?.description ?? ""} className="input" /></Field>
      <div className="flex gap-6 sm:col-span-4">
        <Check name="isActive" label="Active" defaultChecked={c?.isActive ?? true} />
        <Check name="showOnHome" label="Afficher sur l'accueil" defaultChecked={c?.showOnHome ?? true} />
      </div>
    </div>
  );
}

export default async function CategoriesPage() {
  const cats = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <div className="max-w-5xl space-y-6">
      <PageTitle title="Catégories" subtitle="Championnats, sélections, rétro… Nouveautés et Promotions sont automatiques (cases du produit et prix barré)." />
      {cats.map((c) => (
        <details key={c.id} className="card p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <span><strong>{c.name}</strong> <span className="text-sm text-bone-dim">· {CATEGORY_TYPE_LABELS[c.type]} · {c._count.products} produit(s){!c.isActive && " · inactive"}</span></span>
            <span className="text-xs text-bone-dim underline">Modifier</span>
          </summary>
          <div className="mt-4 border-t border-ink-600 pt-4">
            <ActionForm action={saveCategory}><CategoryFields c={c} /></ActionForm>
            <form action={deleteCategory} className="mt-3"><input type="hidden" name="id" value={c.id} /><ConfirmButton message="Supprimer cette catégorie ? Les produits ne sont pas supprimés." className="text-sm text-signal underline">Supprimer la catégorie</ConfirmButton></form>
          </div>
        </details>
      ))}
      <div className="card p-5">
        <h2 className="mb-4 font-semibold">Nouvelle catégorie</h2>
        <ActionForm action={saveCategory} resetOnSuccess submitLabel="Ajouter"><CategoryFields /></ActionForm>
      </div>
    </div>
  );
}
