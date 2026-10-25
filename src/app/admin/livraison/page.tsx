import type { ShippingMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { centsToInput } from "@/lib/format";
import { deleteShippingMethod, saveShippingMethod } from "@/app/actions/admin";
import { ActionForm, ConfirmButton } from "@/components/admin/ActionForm";
import { Alert, Check, Field, PageTitle } from "@/components/admin/ui";

function Fields({ m }: { m?: ShippingMethod }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {m && <input type="hidden" name="id" value={m.id} />}
      <Field label="Nom" className="sm:col-span-2"><input name="name" required defaultValue={m?.name} className="input" /></Field>
      <Field label="Type"><select name="type" defaultValue={m?.type ?? "HOME"} className="input"><option value="HOME">Domicile</option><option value="RELAY">Point relais</option></select></Field>
      <Field label="Ordre"><input name="sortOrder" type="number" defaultValue={m?.sortOrder ?? 0} className="input" /></Field>
      <Field label="Prix (€)"><input name="price" required defaultValue={centsToInput(m?.price ?? 0)} className="input" /></Field>
      <Field label="Offerte dès (€)" hint="Vide = jamais offerte"><input name="freeOver" defaultValue={centsToInput(m?.freeOver)} className="input" /></Field>
      <Field label="Délai affiché" className="sm:col-span-2" hint="Uniquement un délai réel annoncé par votre transporteur"><input name="deliveryTime" defaultValue={m?.deliveryTime ?? ""} className="input" placeholder="Ex. 2 à 4 jours ouvrés après expédition" /></Field>
      <Field label="Description" className="sm:col-span-3"><input name="description" defaultValue={m?.description ?? ""} className="input" /></Field>
      <div className="flex items-end pb-3"><Check name="isActive" label="Proposé aux clients" defaultChecked={m?.isActive ?? true} /></div>
    </div>
  );
}

export default async function ShippingAdmin() {
  const methods = await prisma.shippingMethod.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="max-w-5xl space-y-6">
      <PageTitle title="Livraison" subtitle="Les frais sont recalculés côté serveur à chaque commande." />
      <Alert tone="info">Point relais : aucun transporteur n&apos;est connecté automatiquement. Si vous activez ce mode, le client saisit le point relais choisi et vous créez l&apos;envoi chez votre transporteur. Une intégration Mondial Relay / Boxtal (carte de sélection) nécessite votre compte et vos clés API.</Alert>
      {methods.map((m) => (
        <div key={m.id} className="card p-5">
          <ActionForm action={saveShippingMethod}><Fields m={m} /></ActionForm>
          <form action={deleteShippingMethod} className="mt-3"><input type="hidden" name="id" value={m.id} /><ConfirmButton message="Supprimer ce mode de livraison ?" className="text-sm text-signal underline">Supprimer</ConfirmButton></form>
        </div>
      ))}
      <div className="card p-5"><h2 className="mb-4 font-semibold">Nouveau mode de livraison</h2><ActionForm action={saveShippingMethod} resetOnSuccess submitLabel="Ajouter"><Fields /></ActionForm></div>
    </div>
  );
}
