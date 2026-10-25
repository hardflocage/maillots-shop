"use client";

import { useActionState } from "react";
import { sendContact } from "@/app/actions/public";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContact, null);
  if (state?.ok) return <div className="card p-8 text-pitch">{state.message}</div>;
  return (
    <form action={action} className="card grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
      <div><label className="label" htmlFor="c-name">Nom</label><input id="c-name" name="name" required className="input" autoComplete="name" /></div>
      <div><label className="label" htmlFor="c-email">E-mail</label><input id="c-email" name="email" type="email" required className="input" autoComplete="email" /></div>
      <div><label className="label" htmlFor="c-order">N° de commande (facultatif)</label><input id="c-order" name="orderNumber" className="input" /></div>
      <div><label className="label" htmlFor="c-subject">Sujet</label><input id="c-subject" name="subject" required className="input" /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" name="message" required minLength={10} rows={6} className="input" /></div>
      {state?.error && <p className="text-sm text-signal sm:col-span-2">{state.error}</p>}
      <button className="btn-primary sm:col-span-2" disabled={pending}>{pending ? "Envoi…" : "Envoyer"}</button>
    </form>
  );
}
