"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { CategoryType } from "@prisma/client";
import { useCart } from "@/components/cart/CartProvider";
import { IconBag, IconClose, IconHeart, IconMenu, IconSearch, IconUser, IconChevronDown } from "@/components/ui/Icons";
import { SearchOverlay } from "./SearchOverlay";

type Cat = { name: string; slug: string; type: CategoryType };

export function HeaderClient({ shopName, announcement, categories, user }: { shopName: string; announcement: string | null; categories: Cat[]; user: { name: string | null; isAdmin: boolean } | null }) {
  const { count, ready, openDrawer } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMega(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  const leagues = categories.filter((c) => c.type === "LEAGUE" || c.type === "COMPETITION");
  const others = categories.filter((c) => c.type !== "LEAGUE" && c.type !== "COMPETITION");

  return (
    <>
      {announcement && (
        <div className="bg-gold px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">{announcement}</div>
      )}
      <header className={`sticky top-0 z-40 transition-colors duration-300 ${scrolled || mega ? "border-b border-ink-600 bg-ink/90 backdrop-blur-xl" : "border-b border-transparent bg-ink/40 backdrop-blur-sm"}`}>
        <div className="container-x flex h-16 items-center gap-4 lg:h-20" onMouseLeave={() => setMega(false)}>
          <button className="-ml-2 p-2 lg:hidden" aria-label="Ouvrir le menu" onClick={() => setMenuOpen(true)}>
            <IconMenu />
          </button>

          <Link href="/" className="font-display text-2xl tracking-[0.18em] text-bone lg:text-[28px]" aria-label={`${shopName} : accueil`}>
            {shopName}
          </Link>

          <nav className="ml-10 hidden items-center gap-8 text-[13px] font-medium uppercase tracking-[0.16em] text-bone-muted lg:flex" aria-label="Navigation principale">
            <button className={`flex items-center gap-1 uppercase tracking-[0.16em] transition hover:text-bone ${mega ? "text-bone" : ""}`} onMouseEnter={() => setMega(true)} onClick={() => setMega((m) => !m)} aria-expanded={mega}>
              Collections <IconChevronDown width={14} height={14} />
            </button>
            <Link href="/boutique?tri=nouveautes" className="transition hover:text-bone">Nouveautés</Link>
            <Link href="/boutique" className="transition hover:text-bone">Tous les maillots</Link>
            <Link href="/boutique?promo=1" className="text-signal transition hover:text-bone">Promotions</Link>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button className="p-2 text-bone-muted transition hover:text-bone" aria-label="Rechercher" onClick={() => setSearchOpen(true)}>
              <IconSearch />
            </button>
            <Link href="/compte/favoris" className="hidden p-2 text-bone-muted transition hover:text-bone sm:block" aria-label="Favoris">
              <IconHeart />
            </Link>
            <Link href={user?.isAdmin ? "/admin" : "/compte"} className="hidden p-2 text-bone-muted transition hover:text-bone sm:block" aria-label={user ? "Mon compte" : "Se connecter"}>
              <IconUser />
            </Link>
            <button className="relative p-2 text-bone transition hover:text-gold" aria-label={`Panier (${count} article${count > 1 ? "s" : ""})`} onClick={openDrawer}>
              <IconBag />
              {ready && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink">{count}</span>
              )}
            </button>
          </div>
        </div>

        {mega && (
          <div className="absolute inset-x-0 top-full hidden animate-fade-in border-b border-ink-600 bg-ink/95 backdrop-blur-xl lg:block" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
            <div className="container-x grid grid-cols-3 gap-10 py-10">
              <div>
                <p className="eyebrow mb-5">Championnats</p>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {leagues.map((c) => (
                    <li key={c.slug}><Link className="text-bone-muted transition hover:text-bone" href={`/collections/${c.slug}`}>{c.name}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-5">Sélections</p>
                <ul className="space-y-3">
                  {others.map((c) => (
                    <li key={c.slug}><Link className="text-bone-muted transition hover:text-bone" href={`/collections/${c.slug}`}>{c.name}</Link></li>
                  ))}
                </ul>
              </div>
              <Link href="/boutique" className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-ink-600 bg-gradient-to-br from-ink-700 to-ink-900 p-6">
                <span className="eyebrow">Catalogue complet</span>
                <span className="h-display mt-2 text-4xl">Tous les maillots</span>
                <span className="mt-3 text-sm text-bone-muted transition group-hover:text-bone">Explorer →</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Menu mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? "" : "pointer-events-none"}`} aria-hidden={!menuOpen}>
        <div className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMenuOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-ink-900 transition-transform duration-300 ease-out ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-16 items-center justify-between border-b border-ink-600 px-5">
            <span className="font-display text-2xl tracking-[0.18em]">{shopName}</span>
            <button className="-mr-2 p-2" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)}><IconClose /></button>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 py-6">
            <ul className="space-y-1 font-display text-3xl uppercase">
              <li><Link className="block py-1.5" href="/boutique">Tous les maillots</Link></li>
              <li><Link className="block py-1.5" href="/boutique?tri=nouveautes">Nouveautés</Link></li>
              <li><Link className="block py-1.5 text-signal" href="/boutique?promo=1">Promotions</Link></li>
            </ul>
            <p className="eyebrow mb-3 mt-8">Collections</p>
            <ul className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <li key={c.slug}><Link className="block rounded-xl border border-ink-600 px-3 py-3 text-sm text-bone-muted active:bg-ink-700" href={`/collections/${c.slug}`}>{c.name}</Link></li>
              ))}
            </ul>
            <ul className="mt-8 space-y-4 text-sm text-bone-muted">
              <li><Link href={user ? "/compte" : "/compte/connexion"}>{user ? "Mon compte" : "Se connecter / Créer un compte"}</Link></li>
              {user?.isAdmin && <li><Link href="/admin" className="text-gold">Administration</Link></li>}
              <li><Link href="/compte/favoris">Mes favoris</Link></li>
              <li><Link href="/suivi">Suivre ma commande</Link></li>
              <li><Link href="/guide-des-tailles">Guide des tailles</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </nav>
        </aside>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
