"use client";

import Image from "next/image";
import Link from "next/link";
import type { CartLine, QuoteLine } from "@/lib/cart-types";
import { formatPrice } from "@/lib/format";
import { IconMinus, IconPlus, IconTrash } from "@/components/ui/Icons";
import { useCart } from "./CartProvider";

export function CartLineItem({ line, server, compact }: { line: CartLine; server?: QuoteLine; compact?: boolean }) {
  const { setQuantity, remove } = useCart();
  const unit = server ? server.unitPrice + server.customizationPrice : line.unitPrice + line.customizationPrice;
  const max = server ? Math.max(1, Math.min(server.available, 20)) : 20;
  return (
    <div className="flex gap-4 py-5">
      <Link href={`/maillot/${line.slug}`} className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl bg-ink-700 sm:w-24">
        {line.image && <Image src={line.image} alt={line.name} fill sizes="96px" className="object-cover" unoptimized={line.image.endsWith(".svg")} />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/maillot/${line.slug}`} className="block truncate font-medium text-bone hover:text-gold">{line.name}</Link>
            <p className="mt-0.5 text-sm text-bone-muted">Taille {line.size}</p>
            {line.customization ? (
              <p className="mt-0.5 text-sm text-bone-muted">
                Flocage : <span className="text-bone">{line.customization.name} · {line.customization.number}</span>
                <span className="text-bone-dim"> (+{formatPrice(server?.customizationPrice ?? line.customizationPrice)})</span>
              </p>
            ) : (
              !compact && <p className="mt-0.5 text-sm text-bone-dim">Sans flocage</p>
            )}
          </div>
          <p className="shrink-0 font-medium">{formatPrice(unit * line.quantity)}</p>
        </div>
        {server?.error && <p className="mt-2 rounded-lg bg-signal/10 px-3 py-2 text-xs text-signal">{server.error}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center rounded-full border border-ink-500">
            <button className="p-2.5 text-bone-muted hover:text-bone disabled:opacity-30" aria-label="Diminuer la quantité" disabled={line.quantity <= 1} onClick={() => setQuantity(line.key, line.quantity - 1)}><IconMinus width={16} height={16} /></button>
            <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{line.quantity}</span>
            <button className="p-2.5 text-bone-muted hover:text-bone disabled:opacity-30" aria-label="Augmenter la quantité" disabled={line.quantity >= max} onClick={() => setQuantity(line.key, line.quantity + 1)}><IconPlus width={16} height={16} /></button>
          </div>
          <button onClick={() => remove(line.key)} className="flex items-center gap-1.5 p-2 text-xs uppercase tracking-wider text-bone-dim hover:text-signal" aria-label={`Retirer ${line.name}`}>
            <IconTrash width={16} height={16} /> <span className="hidden sm:inline">Retirer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
