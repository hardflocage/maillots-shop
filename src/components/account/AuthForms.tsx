"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, requestPasswordReset, resetPassword } from "@/app/actions/account";

function Shell({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-md">
        <h1 className="h-display mb-8 text-center text-5xl">{title}</h1>
        <div className="card p-6 sm:p-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-bone-muted">{footer}</div>}
      </div>
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <Shell title="Connexion" footer={<>Pas encore de compte ? <Link href={`/compte/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-bone underline">Créer un compte</Link></>}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <div><label className="label" htmlFor="email">E-mail</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
        <div><label className="label" htmlFor="password">Mot de passe</label><input id="password" name="password" type="password" required autoComplete="current-password" className="input" /></div>
        {state?.error && <p className="text-sm text-signal" role="alert">{state.error}</p>}
        <button className="btn-primary w-full" disabled={pending}>{pending ? "Connexion…" : "Se connecter"}</button>
        <p className="text-center text-sm"><Link href="/compte/mot-de-passe-oublie" className="text-bone-muted underline">Mot de passe oublié ?</Link></p>
      </form>
    </Shell>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(register, null);
  return (
    <Shell title="Créer un compte" footer={<>Déjà inscrit ? <Link href="/compte/connexion" className="text-bone underline">Se connecter</Link></>}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <div><label className="label" htmlFor="name">Prénom et nom</label><input id="name" name="name" required autoComplete="name" className="input" /></div>
        <div><label className="label" htmlFor="email">E-mail</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
        <div><label className="label" htmlFor="password">Mot de passe (8 caractères min.)</label><input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className="input" /></div>
        <label className="flex items-start gap-2 text-sm text-bone-muted"><input type="checkbox" name="newsletter" className="mt-0.5 accent-[#D6B36A]" /> Recevoir les nouveautés et offres par e-mail (facultatif)</label>
        {state?.error && <p className="text-sm text-signal" role="alert">{state.error}</p>}
        <button className="btn-primary w-full" disabled={pending}>{pending ? "Création…" : "Créer mon compte"}</button>
        <p className="text-xs text-bone-dim">En créant un compte, tu acceptes notre <Link href="/pages/confidentialite" className="underline">politique de confidentialité</Link>.</p>
      </form>
    </Shell>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  return (
    <Shell title="Mot de passe oublié" footer={<Link href="/compte/connexion" className="underline">Retour à la connexion</Link>}>
      {state?.ok ? <p className="text-pitch">{state.message}</p> : (
        <form action={action} className="space-y-4">
          <div><label className="label" htmlFor="email">E-mail du compte</label><input id="email" name="email" type="email" required className="input" /></div>
          {state?.error && <p className="text-sm text-signal">{state.error}</p>}
          <button className="btn-primary w-full" disabled={pending}>Recevoir un lien</button>
        </form>
      )}
    </Shell>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, null);
  return (
    <Shell title="Nouveau mot de passe">
      {state?.ok ? <p className="text-pitch">{state.message} <Link href="/compte/connexion" className="underline">Se connecter</Link></p> : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div><label className="label" htmlFor="password">Nouveau mot de passe</label><input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className="input" /></div>
          {state?.error && <p className="text-sm text-signal">{state.error}</p>}
          <button className="btn-primary w-full" disabled={pending}>Enregistrer</button>
        </form>
      )}
    </Shell>
  );
}
