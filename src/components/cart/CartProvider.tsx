"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { lineKey, type CartLine } from "@/lib/cart-types";

const STORAGE_KEY = "mlt_cart_v1";
const PROMO_KEY = "mlt_promo_v1";

type CartCtx = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  drawerOpen: boolean;
  promoCode: string;
  setPromoCode: (c: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, q: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [promoCode, setPromo] = useState("");
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const stored = read<CartLine[]>(STORAGE_KEY, []);
    setLines(Array.isArray(stored) ? stored.filter((l) => l && l.variantId && l.quantity > 0) : []);
    setPromo(read<string>(PROMO_KEY, ""));
    setReady(true);
    // synchronisation entre onglets
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLines(read<CartLine[]>(STORAGE_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    return next;
  }, []);

  const add = useCallback<CartCtx["add"]>(
    (line) => {
      setLines((prev) => {
        const key = lineKey(line.variantId, line.customization);
        const existing = prev.find((l) => l.key === key);
        const next = existing
          ? prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(l.quantity + line.quantity, 20) } : l))
          : [...prev, { ...line, key }];
        return persist(next);
      });
      setDrawerOpen(true);
    },
    [persist],
  );

  const setQuantity = useCallback(
    (key: string, q: number) => setLines((prev) => persist(prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(q, 20)) } : l)))),
    [persist],
  );
  const remove = useCallback((key: string) => setLines((prev) => persist(prev.filter((l) => l.key !== key))), [persist]);
  const clear = useCallback(() => setLines(persist([])), [persist]);
  const setPromoCode = useCallback((c: string) => {
    setPromo(c);
    try {
      localStorage.setItem(PROMO_KEY, JSON.stringify(c));
    } catch {}
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      ready,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      drawerOpen,
      promoCode,
      setPromoCode,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, ready, drawerOpen, promoCode, setPromoCode, add, setQuantity, remove, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return c;
}
