"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "mlt_consent_v1";
export type Consent = { necessary: true; analytics: boolean; date: string };

export function getConsent(): Consent | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}

/**
 * Le site n'utilise par défaut que des cookies/stockages strictement nécessaires
 * (session, panier). Aucun traceur n'est chargé sans accord. Si vous ajoutez un outil
 * de mesure d'audience, chargez-le uniquement lorsque getConsent()?.analytics est vrai.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!getConsent()) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener("mlt:open-consent", reopen);
    return () => window.removeEventListener("mlt:open-consent", reopen);
  }, []);
  if (!open) return null;
  const save = (analytics: boolean) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ necessary: true, analytics, date: new Date().toISOString() }));
    } catch {}
    setOpen(false);
  };
  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl animate-fade-up rounded-2xl border border-ink-500 bg-ink-800/95 p-5 shadow-2xl backdrop-blur-xl sm:bottom-6" role="dialog" aria-label="Gestion des cookies">
      <p className="text-sm font-semibold text-bone">Cookies</p>
      <p className="mt-1.5 text-sm leading-relaxed text-bone-muted">
        Nous utilisons uniquement les cookies nécessaires au fonctionnement du site (panier, connexion, paiement). Avec ton accord, nous pourrons mesurer l&apos;audience pour améliorer la boutique.{" "}
        <Link href="/pages/confidentialite" className="underline">En savoir plus</Link>
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button className="btn-ghost flex-1 py-3" onClick={() => save(false)}>Refuser</button>
        <button className="btn-light flex-1 py-3" onClick={() => save(true)}>Accepter</button>
      </div>
    </div>
  );
}

export function CookieSettingsLink() {
  return (
    <button className="hover:text-bone" onClick={() => window.dispatchEvent(new Event("mlt:open-consent"))}>
      Gérer les cookies
    </button>
  );
}
