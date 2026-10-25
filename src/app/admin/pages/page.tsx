import { prisma } from "@/lib/prisma";
import { savePage } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/ActionForm";
import { Alert, Field, PageTitle } from "@/components/admin/ui";

export default async function PagesAdmin() {
  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });
  return (
    <div className="max-w-4xl space-y-4">
      <PageTitle title="Pages & textes légaux" subtitle="Mise en forme : ## Titre, - liste, **gras**, [lien](/adresse)." />
      <Alert>Remplacez chaque mention <strong>[À COMPLÉTER]</strong> par vos vraies informations avant l&apos;ouverture. Faites relire CGV et mentions légales par un professionnel.</Alert>
      {pages.map((p) => (
        <details key={p.slug} className="card p-5">
          <summary className="flex cursor-pointer list-none justify-between">
            <span><strong>{p.title}</strong> <span className="text-xs text-bone-dim">/{p.slug}</span>{p.content.includes("[À COMPLÉTER]") && <span className="ml-2 text-xs text-gold">à compléter</span>}</span>
            <span className="text-xs text-bone-dim underline">Modifier</span>
          </summary>
          <div className="mt-4 border-t border-ink-600 pt-4">
            <ActionForm action={savePage} className="space-y-3">
              <input type="hidden" name="slug" value={p.slug} />
              <Field label="Titre"><input name="title" defaultValue={p.title} className="input" /></Field>
              <Field label="Contenu"><textarea name="content" defaultValue={p.content} rows={18} className="input font-mono text-sm" /></Field>
            </ActionForm>
          </div>
        </details>
      ))}
    </div>
  );
}
