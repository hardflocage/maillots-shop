"use client";

import Link from "next/link";
import { useActionState } from "react";
import { subscribeNewsletter } from "@/app/actions/public";

export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [state, action, pending] = useActionState(subscribeNewsletter, null);
  if (state?.ok) return <p className="rounded-xl border border-pitch/30 bg-pitch/10 px-4 py-3 text-sm text-pitch">{state.message}</p>;
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="source" value={source} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input name="email" type="email" required placeholder="Ton adresse e-mail" className="input flex-1" aria-label="Adresse e-mail" autoComplete="email" />
        <button className="btn-primary shrink-0" disabled={pending}>{pending ? "…" : "S'inscrire"}</button>
      </div>
      <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-bone-dim">
        <input type="checkbox" name="consent" required className="mt-0.5 accent-[#D6B36A]" />
        <span>J&apos;accepte de recevoir les nouveautés et offres par e-mail. Désinscription possible à tout moment. <Link href="/pages/confidentialite" className="underline">Confidentialité</Link></span>
      </label>
      {state?.error && <p className="mt-2 text-sm text-signal">{state.error}</p>}
    </form>
  );
}
