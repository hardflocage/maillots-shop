"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "@/components/ui/Icons";

/** Guide des tailles en panneau latéral : consultable sans quitter la fiche produit. */
export function SizeGuideButton({ html }: { html: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-bone-muted underline underline-offset-4 hover:text-bone">Guide des tailles</button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Guide des tailles">
            <div className="absolute inset-0 animate-fade-in bg-black/70" onClick={() => setOpen(false)} />
            <aside className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl bg-ink-900 sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none">
              <div className="flex items-center justify-between border-b border-ink-600 px-5 py-4">
                <p className="font-display text-2xl uppercase">Guide des tailles</p>
                <button onClick={() => setOpen(false)} className="-mr-2 p-2" aria-label="Fermer le guide des tailles"><IconClose /></button>
              </div>
              <div className="prose-shop safe-bottom flex-1 overflow-y-auto px-5 py-6" dangerouslySetInnerHTML={{ __html: html }} />
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
