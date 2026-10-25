import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { savePage } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/ActionForm";
import { Alert, Field, PageTitle } from "@/components/admin/ui";
import { PLACEHOLDERS, loadPlaceholderValues, missingPlaceholders } from "@/lib/content";

export default async function PagesAdmin() {
  const [pages, values] = await Promise.all([prisma.page.findMany({ orderBy: { title: "asc" } }), loadPlaceholderValues()]);
  const label = (k: string) => PLACEHOLDERS.find((p) => p.key === k)?.label ?? k;
  return (
    <div className="max-w-4xl space-y-4">
      <PageTitle title="Pages & textes légaux" subtitle="Mise en forme : ## Titre, - liste, **gras**, [lien](/adresse)." />
      <Alert>
        Les balises comme <code>{"{{siret}}"}</code> sont remplacées automatiquement par les informations de{" "}
        <Link href="/admin/parametres" className="underline">Paramètres</Link>. Tant qu&apos;une information n&apos;est pas renseignée, la ligne correspondante n&apos;est pas affichée sur le site. Faites relire CGV et mentions légales par un professionnel avant l&apos;ouverture.
      </Alert>
      <details className="card p-5 text-sm">
        <summary className="cursor-pointer font-semibold">Balises disponibles</summary>
        <ul className="mt-3 grid gap-1 sm:grid-cols-2">
          {PLACEHOLDERS.map((p) => (
            <li key={p.key}><code className="text-gold">{`{{${p.key}}}`}</code> <span className="text-bone-dim">{p.label}</span></li>
          ))}
        </ul>
      </details>
      {pages.map((p) => {
        const missing = missingPlaceholders(p.content, values);
        return (
          <details key={p.slug} className="card p-5">
            <summary className="flex cursor-pointer list-none justify-between gap-4">
              <span>
                <strong>{p.title}</strong> <span className="text-xs text-bone-dim">/{p.slug}</span>
                {missing.length > 0 && <span className="mt-1 block text-xs text-gold">Non affiché tant que manquant : {missing.map(label).join(", ")}</span>}
              </span>
              <span className="shrink-0 text-xs text-bone-dim underline">Modifier</span>
            </summary>
            <div className="mt-4 border-t border-ink-600 pt-4">
              <ActionForm action={savePage} className="space-y-3">
                <input type="hidden" name="slug" value={p.slug} />
                <Field label="Titre"><input name="title" defaultValue={p.title} className="input" /></Field>
                <Field label="Contenu"><textarea name="content" defaultValue={p.content} rows={18} className="input font-mono text-sm" /></Field>
              </ActionForm>
            </div>
          </details>
        );
      })}
    </div>
  );
}
