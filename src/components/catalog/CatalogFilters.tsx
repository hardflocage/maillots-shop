"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { IconClose, IconFilter } from "@/components/ui/Icons";

const SORTS = [
  { v: "pertinence", l: "Pertinence" },
  { v: "nouveautes", l: "Nouveautés" },
  { v: "ventes", l: "Meilleures ventes" },
  { v: "prix-asc", l: "Prix croissant" },
  { v: "prix-desc", l: "Prix décroissant" },
];

export function CatalogFilters({ categories, clubs, seasons, sizes, fixedCategory }: { categories: { name: string; slug: string }[]; clubs: string[]; seasons: string[]; sizes: string[]; fixedCategory: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const set = (patch: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) (v ? sp.set(k, v) : sp.delete(k));
    sp.delete("page");
    start(() => router.push(`${pathname}${sp.toString() ? `?${sp}` : ""}`, { scroll: false }));
  };
  const toggle = (k: string, v: string) => set({ [k]: params.get(k) === v ? null : v });
  const active = ["q", "categorie", "club", "saison", "taille", "min", "max", "dispo", "promo", "tendance"].filter((k) => params.get(k)).length;

  const Pill = ({ k, v, label }: { k: string; v: string; label?: string }) => {
    const on = params.get(k) === v;
    return (
      <button type="button" onClick={() => toggle(k, v)} aria-pressed={on} className={`rounded-full border px-3.5 py-2 text-sm transition ${on ? "border-gold bg-gold/10 text-gold" : "border-ink-500 text-bone-muted hover:border-bone/40 hover:text-bone"}`}>
        {label ?? v}
      </button>
    );
  };

  const panel = (
    <div className={`space-y-8 ${pending ? "opacity-60" : ""}`}>
      <form onSubmit={(e) => { e.preventDefault(); set({ q: q.trim() || null }); }}>
        <label className="label" htmlFor="f-q">Recherche</label>
        <input id="f-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Club, joueur, saison…" enterKeyHint="search" />
      </form>
      <div>
        <label className="label" htmlFor="f-sort">Trier par</label>
        <select id="f-sort" className="input" value={params.get("tri") ?? "pertinence"} onChange={(e) => set({ tri: e.target.value === "pertinence" ? null : e.target.value })}>
          {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Pill k="dispo" v="1" label="En stock" />
        <Pill k="promo" v="1" label="En promotion" />
        <Pill k="tendance" v="1" label="Tendances" />
      </div>
      {!fixedCategory && categories.length > 0 && (
        <div>
          <p className="label">Championnat / collection</p>
          <div className="flex flex-wrap gap-2">{categories.map((c) => <Pill key={c.slug} k="categorie" v={c.slug} label={c.name} />)}</div>
        </div>
      )}
      {sizes.length > 0 && (
        <div>
          <p className="label">Taille</p>
          <div className="flex flex-wrap gap-2">{sizes.map((s) => <Pill key={s} k="taille" v={s} />)}</div>
        </div>
      )}
      <div>
        <p className="label">Prix (€)</p>
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); set({ min: min || null, max: max || null }); }}>
          <input className="input" inputMode="decimal" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} aria-label="Prix minimum" />
          <span className="text-bone-dim">–</span>
          <input className="input" inputMode="decimal" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} aria-label="Prix maximum" />
          <button className="btn-ghost px-4 py-3">OK</button>
        </form>
      </div>
      {clubs.length > 0 && (
        <div>
          <label className="label" htmlFor="f-club">Club / sélection</label>
          <select id="f-club" className="input" value={params.get("club") ?? ""} onChange={(e) => set({ club: e.target.value || null })}>
            <option value="">Tous</option>
            {clubs.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}
      {seasons.length > 0 && (
        <div>
          <label className="label" htmlFor="f-season">Saison</label>
          <select id="f-season" className="input" value={params.get("saison") ?? ""} onChange={(e) => set({ saison: e.target.value || null })}>
            <option value="">Toutes</option>
            {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}
      {active > 0 && (
        <button type="button" className="text-sm text-bone-muted underline underline-offset-4 hover:text-bone" onClick={() => { setQ(""); setMin(""); setMax(""); start(() => router.push(pathname)); }}>
          Effacer les filtres
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="sticky top-16 z-20 -mx-4 mb-6 flex gap-2 border-b border-ink-600 bg-ink/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button className="btn-ghost flex-1 py-3" onClick={() => setOpen(true)}>
          <IconFilter width={18} height={18} /> Filtres {active > 0 && <span className="rounded-full bg-gold px-2 text-[11px] text-ink">{active}</span>}
        </button>
        <select className="input flex-1 py-2.5 text-sm" value={params.get("tri") ?? "pertinence"} onChange={(e) => set({ tri: e.target.value === "pertinence" ? null : e.target.value })} aria-label="Trier">
          {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
      </div>
      <aside className="hidden lg:block"><div className="sticky top-28">{panel}</div></aside>

      <div className={`fixed inset-0 z-[60] lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black/70 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <div className={`absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl bg-ink-900 transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`} role="dialog" aria-label="Filtres">
          <div className="flex items-center justify-between border-b border-ink-600 px-5 py-4">
            <p className="font-display text-2xl uppercase">Filtres</p>
            <button className="-mr-2 p-2" onClick={() => setOpen(false)} aria-label="Fermer les filtres"><IconClose /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">{panel}</div>
          <div className="safe-bottom border-t border-ink-600 px-5 pt-3">
            <button className="btn-primary w-full" onClick={() => setOpen(false)}>Voir les résultats</button>
          </div>
        </div>
      </div>
    </>
  );
}
