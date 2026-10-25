"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { IconClose, IconSearch } from "@/components/ui/Icons";

type Suggest = {
  products: { slug: string; name: string; image: string | null; price: number }[];
  clubs: string[];
  players: { name: string; number: number; slug: string }[];
  categories: { name: string; slug: string }[];
};

const POPULAR = ["Real Madrid", "PSG", "Barcelone", "Maillot rétro", "France", "Domicile"];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [data, setData] = useState<Suggest | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [open, onClose]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setData(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    }, 160);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  if (!open) return null;

  const go = (query: string) => {
    onClose();
    router.push(`/boutique?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="fixed inset-0 z-[60] animate-fade-in bg-ink/95 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="Recherche">
      <div className="container-x pt-6 sm:pt-12">
        <form
          className="flex items-center gap-3 border-b border-ink-500 pb-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) go(q.trim());
          }}
        >
          <IconSearch className="shrink-0 text-bone-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-transparent font-display text-3xl uppercase tracking-wide text-bone placeholder:text-bone-dim focus:outline-none sm:text-5xl"
            placeholder="Club, joueur, saison…"
            aria-label="Rechercher un maillot"
            enterKeyHint="search"
          />
          <button type="button" onClick={onClose} className="p-2 text-bone-muted hover:text-bone" aria-label="Fermer la recherche"><IconClose /></button>
        </form>

        <div className="max-h-[calc(100dvh-140px)] overflow-y-auto py-8">
          {!data && (
            <div>
              <p className="eyebrow mb-4">Recherches populaires</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <button key={p} onClick={() => go(p)} className="rounded-full border border-ink-500 px-4 py-2 text-sm text-bone-muted transition hover:border-bone/50 hover:text-bone">{p}</button>
                ))}
              </div>
            </div>
          )}
          {data && (
            <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
              <div className="space-y-8">
                {data.clubs.length > 0 && (
                  <div>
                    <p className="eyebrow mb-3">Clubs</p>
                    <ul className="space-y-2">{data.clubs.map((c) => <li key={c}><button className="text-lg text-bone-muted hover:text-bone" onClick={() => go(c)}>{c}</button></li>)}</ul>
                  </div>
                )}
                {data.players.length > 0 && (
                  <div>
                    <p className="eyebrow mb-3">Joueurs</p>
                    <ul className="space-y-2">{data.players.map((p) => <li key={p.slug + p.name}><Link onClick={onClose} className="text-lg text-bone-muted hover:text-bone" href={`/maillot/${p.slug}`}>{p.name} · {p.number}</Link></li>)}</ul>
                  </div>
                )}
                {data.categories.length > 0 && (
                  <div>
                    <p className="eyebrow mb-3">Collections</p>
                    <ul className="space-y-2">{data.categories.map((c) => <li key={c.slug}><Link onClick={onClose} className="text-lg text-bone-muted hover:text-bone" href={`/collections/${c.slug}`}>{c.name}</Link></li>)}</ul>
                  </div>
                )}
              </div>
              <div>
                <p className="eyebrow mb-3">Maillots</p>
                {data.products.length === 0 ? (
                  <p className="text-bone-muted">Aucun maillot ne correspond à « {q} ».</p>
                ) : (
                  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {data.products.map((p) => (
                      <li key={p.slug}>
                        <Link onClick={onClose} href={`/maillot/${p.slug}`} className="group block">
                          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink-800">
                            {p.image && <Image src={p.image} alt={p.name} fill sizes="200px" className="object-cover transition duration-500 group-hover:scale-105" unoptimized={p.image.endsWith(".svg")} />}
                          </div>
                          <p className="mt-2 text-sm text-bone">{p.name}</p>
                          <p className="text-sm text-bone-muted">{formatPrice(p.price)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={() => go(q)} className="btn-ghost mt-6">Voir tous les résultats</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
