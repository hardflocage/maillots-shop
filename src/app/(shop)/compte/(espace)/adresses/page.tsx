import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteAddress } from "@/app/actions/account";
import { AddressForm } from "./AddressForm";

export const metadata: Metadata = { title: "Mes adresses", robots: { index: false } };

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }] });
  return (
    <div className="space-y-6">
      {addresses.map((a) => (
        <details key={a.id} className="card p-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
            <span className="text-sm">
              <span className="font-semibold text-bone">{a.label || `${a.firstName} ${a.lastName}`}</span>{a.isDefault && <span className="chip ml-2">Par défaut</span>}
              <span className="block text-bone-muted">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.postalCode} {a.city}</span>
            </span>
            <span className="text-xs text-bone-dim underline">Modifier</span>
          </summary>
          <div className="mt-5 border-t border-ink-600 pt-5">
            <AddressForm address={a} />
            <form action={deleteAddress} className="mt-3"><input type="hidden" name="id" value={a.id} /><button className="text-sm text-signal underline">Supprimer cette adresse</button></form>
          </div>
        </details>
      ))}
      <div className="card p-5 sm:p-6">
        <p className="mb-4 font-semibold">Ajouter une adresse</p>
        <AddressForm />
      </div>
    </div>
  );
}
