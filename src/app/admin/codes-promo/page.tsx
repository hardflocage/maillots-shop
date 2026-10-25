import type { AutoDiscount, PromoCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { centsToInput, formatDate, formatPrice } from "@/lib/format";
import { deleteAutoDiscount, deletePromoCode, saveAutoDiscount, savePromoCode } from "@/app/actions/admin";
import { ActionForm, ConfirmButton } from "@/components/admin/ActionForm";
import { Check, Field, PageTitle } from "@/components/admin/ui";

const d = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : "");

function PromoFields({ p }: { p?: PromoCode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {p && <input type="hidden" name="id" value={p.id} />}
      <Field label="Code"><input name="code" required defaultValue={p?.code} className="input uppercase" placeholder="BIENVENUE10" /></Field>
      <Field label="Type">
        <select name="type" defaultValue={p?.type ?? "PERCENT"} className="input"><option value="PERCENT">Pourcentage (%)</option><option value="FIXED">Montant fixe (€)</option></select>
      </Field>
      <Field label="Valeur" hint="10 = 10 % ou 10,00 €"><input name="value" required defaultValue={p ? (p.type === "FIXED" ? centsToInput(p.value) : p.value) : ""} className="input" /></Field>
      <Field label="Panier minimum (€)"><input name="minSubtotal" defaultValue={centsToInput(p?.minSubtotal)} className="input" /></Field>
      <Field label="Utilisations max"><input name="maxUses" type="number" min={1} defaultValue={p?.maxUses ?? ""} className="input" /></Field>
      <Field label="Début"><input name="startsAt" type="date" defaultValue={d(p?.startsAt ?? null)} className="input" /></Field>
      <Field label="Fin (incluse)"><input name="expiresAt" type="date" defaultValue={d(p?.expiresAt ?? null)} className="input" /></Field>
      <div className="flex items-end pb-3"><Check name="isActive" label="Actif" defaultChecked={p?.isActive ?? true} /></div>
    </div>
  );
}

function AutoFields({ a }: { a?: AutoDiscount }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {a && <input type="hidden" name="id" value={a.id} />}
      <Field label="Nom affiché"><input name="name" defaultValue={a?.name} className="input" placeholder="Offre 2 maillots" /></Field>
      <Field label="À partir de (articles)"><input name="minQuantity" type="number" min={2} required defaultValue={a?.minQuantity ?? 2} className="input" /></Field>
      <Field label="Réduction (%)"><input name="percentOff" type="number" min={1} max={90} required defaultValue={a?.percentOff ?? 10} className="input" /></Field>
      <div className="flex items-end pb-3"><Check name="isActive" label="Active" defaultChecked={a?.isActive ?? true} /></div>
    </div>
  );
}

export default async function PromosAdmin() {
  const [codes, autos] = await Promise.all([prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } }), prisma.autoDiscount.findMany({ orderBy: { minQuantity: "asc" } })]);
  return (
    <div className="max-w-5xl space-y-10">
      <PageTitle title="Promotions" subtitle="Pour une promotion sur un maillot précis, renseignez son prix barré dans la fiche produit." />
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Codes promo</h2>
        {codes.map((c) => (
          <details key={c.id} className="card p-5">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm">
              <span><strong className="font-mono text-base">{c.code}</strong> · {c.type === "PERCENT" ? `−${c.value} %` : `−${formatPrice(c.value)}`} · utilisé {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""} fois{c.expiresAt && ` · jusqu'au ${formatDate(c.expiresAt)}`}{!c.isActive && " · inactif"}</span>
              <span className="text-xs text-bone-dim underline">Modifier</span>
            </summary>
            <div className="mt-4 border-t border-ink-600 pt-4">
              <ActionForm action={savePromoCode}><PromoFields p={c} /></ActionForm>
              <form action={deletePromoCode} className="mt-3"><input type="hidden" name="id" value={c.id} /><ConfirmButton message="Supprimer ce code ?" className="text-sm text-signal underline">Supprimer</ConfirmButton></form>
            </div>
          </details>
        ))}
        <div className="card p-5"><h3 className="mb-4 font-semibold">Nouveau code</h3><ActionForm action={savePromoCode} resetOnSuccess submitLabel="Créer le code"><PromoFields /></ActionForm></div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Remises automatiques (plusieurs maillots)</h2>
        <p className="text-sm text-bone-muted">Appliquées automatiquement au panier selon le nombre d&apos;articles. La plus avantageuse s&apos;applique ; un code promo peut s&apos;y ajouter.</p>
        {autos.map((a) => (
          <div key={a.id} className="card p-5">
            <ActionForm action={saveAutoDiscount}><AutoFields a={a} /></ActionForm>
            <form action={deleteAutoDiscount} className="mt-3"><input type="hidden" name="id" value={a.id} /><ConfirmButton message="Supprimer cette remise ?" className="text-sm text-signal underline">Supprimer</ConfirmButton></form>
          </div>
        ))}
        <div className="card p-5"><h3 className="mb-4 font-semibold">Nouvelle remise</h3><ActionForm action={saveAutoDiscount} resetOnSuccess submitLabel="Ajouter"><AutoFields /></ActionForm></div>
      </section>
    </div>
  );
}
