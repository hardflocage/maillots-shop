"use client";

import { useActionState } from "react";
import type { Address } from "@prisma/client";
import { saveAddress } from "@/app/actions/account";

export function AddressForm({ address }: { address?: Address }) {
  const [state, action, pending] = useActionState(saveAddress, null);
  const a = address;
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {a && <input type="hidden" name="id" value={a.id} />}
      <input name="label" defaultValue={a?.label ?? ""} placeholder="Nom de l'adresse (ex. Maison)" className="input sm:col-span-2" />
      <input name="firstName" defaultValue={a?.firstName} required placeholder="Prénom" className="input" />
      <input name="lastName" defaultValue={a?.lastName} required placeholder="Nom" className="input" />
      <input name="line1" defaultValue={a?.line1} required placeholder="Adresse" className="input sm:col-span-2" />
      <input name="line2" defaultValue={a?.line2 ?? ""} placeholder="Complément" className="input sm:col-span-2" />
      <input name="postalCode" defaultValue={a?.postalCode} required placeholder="Code postal" className="input" />
      <input name="city" defaultValue={a?.city} required placeholder="Ville" className="input" />
      <select name="country" defaultValue={a?.country ?? "FR"} className="input">
        {["FR", "BE", "CH", "LU", "MC", "DE", "ES", "IT", "NL", "PT"].map((c) => <option key={c}>{c}</option>)}
      </select>
      <input name="phone" defaultValue={a?.phone ?? ""} placeholder="Téléphone" className="input" />
      <label className="flex items-center gap-2 text-sm text-bone-muted sm:col-span-2"><input type="checkbox" name="isDefault" defaultChecked={a?.isDefault} className="accent-[#D6B36A]" /> Adresse par défaut</label>
      {state?.error && <p className="text-sm text-signal sm:col-span-2">{state.error}</p>}
      {state?.ok && <p className="text-sm text-pitch sm:col-span-2">{state.message}</p>}
      <button className="btn-primary sm:col-span-2" disabled={pending}>Enregistrer</button>
    </form>
  );
}
