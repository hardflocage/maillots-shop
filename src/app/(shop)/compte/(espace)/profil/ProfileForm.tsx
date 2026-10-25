"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/account";

export function ProfileForm({ user }: { user: { name: string; email: string; phone: string } }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action} className="card grid max-w-xl gap-4 p-6 sm:p-8">
      <div><label className="label">E-mail</label><input value={user.email} disabled className="input opacity-60" /></div>
      <div><label className="label" htmlFor="name">Nom</label><input id="name" name="name" defaultValue={user.name} required className="input" /></div>
      <div><label className="label" htmlFor="phone">Téléphone</label><input id="phone" name="phone" defaultValue={user.phone} className="input" /></div>
      <p className="pt-2 text-sm font-semibold">Changer de mot de passe (facultatif)</p>
      <input name="currentPassword" type="password" placeholder="Mot de passe actuel" className="input" autoComplete="current-password" />
      <input name="newPassword" type="password" placeholder="Nouveau mot de passe" minLength={8} className="input" autoComplete="new-password" />
      {state?.error && <p className="text-sm text-signal">{state.error}</p>}
      {state?.ok && <p className="text-sm text-pitch">{state.message}</p>}
      <button className="btn-primary" disabled={pending}>Enregistrer</button>
    </form>
  );
}
