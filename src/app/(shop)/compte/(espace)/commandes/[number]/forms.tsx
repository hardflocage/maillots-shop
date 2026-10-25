"use client";

import { useActionState, useState } from "react";
import { requestReturn, submitReview } from "@/app/actions/account";

export function ReturnForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(requestReturn, null);
  if (state?.ok) return <p className="text-sm text-pitch">{state.message}</p>;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-sm text-bone-muted">Les articles floqués ne sont pas repris (sauf défaut). Voir la politique de retour.</p>
      <select name="reason" required className="input" defaultValue="">
        <option value="" disabled>Motif</option>
        <option>Taille ne convient pas</option>
        <option>Article défectueux</option>
        <option>Erreur dans la commande</option>
        <option>Colis non reçu</option>
        <option>Autre</option>
      </select>
      <textarea name="message" rows={3} className="input" placeholder="Précisions (facultatif)" />
      {state?.error && <p className="text-sm text-signal">{state.error}</p>}
      <button className="btn-ghost" disabled={pending}>Envoyer la demande</button>
    </form>
  );
}

export function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitReview, null);
  if (state?.ok) return <p className="mt-3 text-sm text-pitch">{state.message}</p>;
  if (!open) return <button onClick={() => setOpen(true)} className="mt-3 text-sm text-gold underline underline-offset-4">Laisser un avis</button>;
  return (
    <form action={action} className="mt-3 space-y-3 rounded-xl border border-ink-600 p-4">
      <input type="hidden" name="productId" value={productId} />
      <select name="rating" required className="input" defaultValue="5">
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n}/5)</option>)}
      </select>
      <input name="title" className="input" placeholder="Titre (facultatif)" maxLength={100} />
      <textarea name="body" required minLength={10} rows={3} className="input" placeholder="Ton avis sur le maillot" />
      {state?.error && <p className="text-sm text-signal">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>Publier</button>
    </form>
  );
}
