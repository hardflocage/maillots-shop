"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions/account";
import { IconHeart } from "@/components/ui/Icons";

export function FavoriteButton({ productId, initial, loggedIn }: { productId: string; initial: boolean; loggedIn: boolean }) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      onClick={() => {
        if (!loggedIn) return router.push(`/compte/connexion?next=${encodeURIComponent(window.location.pathname)}`);
        setFav((f) => !f);
        start(async () => setFav(await toggleFavorite(productId)));
      }}
      disabled={pending}
      aria-pressed={fav}
      aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border transition ${fav ? "border-gold text-gold" : "border-ink-500 text-bone-muted hover:text-bone"}`}
    >
      <IconHeart fill={fav ? "currentColor" : "none"} />
    </button>
  );
}
