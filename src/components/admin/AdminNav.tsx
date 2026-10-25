"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconClose, IconMenu } from "@/components/ui/Icons";

const LINKS: [string, string][] = [
  ["/admin", "Tableau de bord"],
  ["/admin/commandes", "Commandes"],
  ["/admin/produits", "Produits"],
  ["/admin/stocks", "Stocks"],
  ["/admin/categories", "Catégories"],
  ["/admin/codes-promo", "Promotions"],
  ["/admin/livraison", "Livraison"],
  ["/admin/retours", "Retours"],
  ["/admin/avis", "Avis clients"],
  ["/admin/messages", "Messages"],
  ["/admin/clients", "Clients & newsletter"],
  ["/admin/pages", "Pages & textes légaux"],
  ["/admin/parametres", "Paramètres"],
];

export function AdminNav({ shopName, badges }: { shopName: string; badges: Record<string, number> }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav className="space-y-0.5">
      {LINKS.map(([href, label]) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-white/10 text-bone" : "text-bone-muted hover:bg-white/5 hover:text-bone"}`}>
            {label}
            {badges[href] ? <span className="rounded-full bg-gold px-2 text-[11px] font-bold text-ink">{badges[href]}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-600 bg-ink-900 px-4 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Menu" className="-ml-2 p-2"><IconMenu /></button>
        <span className="font-display tracking-[0.18em]">{shopName} · ADMIN</span>
        <Link href="/" className="text-xs text-bone-muted">Site</Link>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-ink-900 p-4">
            <button onClick={() => setOpen(false)} className="mb-4 p-2" aria-label="Fermer"><IconClose /></button>
            {nav}
          </aside>
        </div>
      )}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-ink-600 bg-ink-900 p-5 lg:flex">
        <Link href="/admin" className="mb-1 font-display text-2xl tracking-[0.18em]">{shopName}</Link>
        <p className="mb-6 text-[11px] uppercase tracking-[0.2em] text-gold">Administration</p>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <Link href="/" className="mt-4 rounded-lg border border-ink-500 px-3 py-2.5 text-center text-sm text-bone-muted hover:text-bone">Voir la boutique ↗</Link>
      </aside>
    </>
  );
}
