"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useQuote } from "@/components/cart/useQuote";
import { PromoCodeField } from "@/components/cart/PromoCodeField";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { formatPrice } from "@/lib/format";
import { IconShield } from "@/components/ui/Icons";

type Method = { id: string; name: string; description: string | null; type: "HOME" | "RELAY"; price: number; freeOver: number | null; deliveryTime: string | null };
type Defaults = { email: string; firstName: string; lastName: string; phone: string; line1: string; line2: string; postalCode: string; city: string; country: string };

const COUNTRIES = [["FR", "France"], ["BE", "Belgique"], ["CH", "Suisse"], ["LU", "Luxembourg"], ["MC", "Monaco"], ["DE", "Allemagne"], ["ES", "Espagne"], ["IT", "Italie"], ["NL", "Pays-Bas"], ["PT", "Portugal"]];

export function CheckoutClient({ methods, defaults, loggedIn, paymentsEnabled, paymentMethods }: { methods: Method[]; defaults: Defaults; loggedIn: boolean; paymentsEnabled: boolean; paymentMethods: string[] }) {
  const { lines, ready } = useCart();
  const params = useSearchParams();
  const [methodId, setMethodId] = useState(methods[0]?.id ?? null);
  const { quote, loading } = useQuote(methodId);
  const [form, setForm] = useState({ ...defaults, relayPoint: "" });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useRef<string>("");
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    token.current = crypto.randomUUID();
    const t = params.get("t");
    if (params.get("annule") && t) {
      setCancelled(true);
      fetch("/api/checkout/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: t }) }).catch(() => {});
    }
  }, [params]);

  const method = methods.find((m) => m.id === methodId);
  const hasCustom = lines.some((l) => l.customization);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!acceptTerms) return setError("Merci d'accepter les conditions générales de vente.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          checkoutToken: token.current,
          shippingMethodId: methodId,
          acceptTerms,
          marketingConsent: marketing,
          promoCode: quote?.promoCode ?? null,
          lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity, customization: l.customization })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error ?? "Une erreur est survenue. Réessaie.");
        token.current = crypto.randomUUID();
        setSubmitting(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Connexion impossible. Vérifie ta connexion internet.");
      setSubmitting(false);
    }
  };

  if (!ready) return <div className="container-x min-h-[60vh]" />;
  if (lines.length === 0) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        {cancelled && <p className="rounded-xl bg-ink-700 px-4 py-3 text-sm text-bone-muted">Paiement annulé. Aucun montant n&apos;a été débité.</p>}
        <h1 className="h-display text-5xl">Ton panier est vide</h1>
        <Link href="/boutique" className="btn-primary">Découvrir les maillots</Link>
      </div>
    );
  }

  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="h-display mb-2 text-5xl sm:text-6xl">Commande</h1>
      <p className="mb-10 text-sm text-bone-muted">{loggedIn ? "Connecté : tes informations sont pré-remplies." : <>Commande sans compte. Déjà client ? <Link href="/compte/connexion?next=/commande" className="underline">Se connecter</Link></>}</p>

      {cancelled && <p className="mb-8 rounded-xl border border-ink-500 bg-ink-800 px-4 py-3 text-sm text-bone-muted">Paiement annulé : aucun montant n&apos;a été débité. Tu peux réessayer quand tu veux.</p>}
      {!paymentsEnabled && (
        <p className="mb-8 rounded-xl border border-signal/30 bg-signal/10 px-4 py-3 text-sm text-signal">
          Le paiement en ligne n&apos;est pas encore activé (configuration Stripe en attente). Les commandes ne peuvent pas être finalisées pour le moment.
        </p>
      )}

      <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-14">
        <div className="space-y-10">
          <section>
            <h2 className="mb-5 font-display text-2xl uppercase">1. Contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label" htmlFor="email">E-mail</label><input id="email" type="email" required autoComplete="email" className="input" value={form.email} onChange={set("email")} /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="phone">Téléphone (pour le transporteur)</label><input id="phone" type="tel" autoComplete="tel" className="input" value={form.phone} onChange={set("phone")} /></div>
            </div>
          </section>

          <section>
            <h2 className="mb-5 font-display text-2xl uppercase">2. Adresse de livraison</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="fn">Prénom</label><input id="fn" required autoComplete="given-name" className="input" value={form.firstName} onChange={set("firstName")} /></div>
              <div><label className="label" htmlFor="ln">Nom</label><input id="ln" required autoComplete="family-name" className="input" value={form.lastName} onChange={set("lastName")} /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="l1">Adresse</label><input id="l1" required autoComplete="address-line1" className="input" value={form.line1} onChange={set("line1")} /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="l2">Complément (facultatif)</label><input id="l2" autoComplete="address-line2" className="input" value={form.line2} onChange={set("line2")} /></div>
              <div><label className="label" htmlFor="pc">Code postal</label><input id="pc" required autoComplete="postal-code" inputMode="numeric" className="input" value={form.postalCode} onChange={set("postalCode")} /></div>
              <div><label className="label" htmlFor="city">Ville</label><input id="city" required autoComplete="address-level2" className="input" value={form.city} onChange={set("city")} /></div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="country">Pays</label>
                <select id="country" className="input" value={form.country} onChange={set("country")} autoComplete="country">
                  {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-5 font-display text-2xl uppercase">3. Livraison</h2>
            {methods.length === 0 ? (
              <p className="text-signal">Aucun mode de livraison n&apos;est configuré.</p>
            ) : (
              <div className="space-y-3" role="radiogroup">
                {methods.map((m) => {
                  const free = m.freeOver != null && quote && quote.subtotal - quote.discountTotal >= m.freeOver;
                  return (
                    <label key={m.id} className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${methodId === m.id ? "border-gold bg-gold/5" : "border-ink-500 hover:border-bone/40"}`}>
                      <input type="radio" name="method" className="mt-1 accent-[#D6B36A]" checked={methodId === m.id} onChange={() => setMethodId(m.id)} />
                      <span className="flex-1">
                        <span className="flex justify-between gap-4 font-medium"><span>{m.name}</span><span>{free || m.price === 0 ? "Offerte" : formatPrice(m.price)}</span></span>
                        {m.description && <span className="mt-1 block text-sm text-bone-muted">{m.description}</span>}
                        {m.deliveryTime && <span className="mt-1 block text-sm text-bone-muted">{m.deliveryTime}</span>}
                        {m.freeOver != null && !free && <span className="mt-1 block text-xs text-bone-dim">Offerte dès {formatPrice(m.freeOver)}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            {method?.type === "RELAY" && (
              <div className="mt-4"><label className="label" htmlFor="relay">Point relais choisi (nom et adresse)</label><input id="relay" required className="input" value={form.relayPoint} onChange={set("relayPoint")} /></div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card space-y-5 p-6">
            <p className="font-display text-2xl uppercase">Ta commande</p>
            <ul className="max-h-[320px] space-y-4 overflow-y-auto pr-1">
              {lines.map((l) => {
                const server = quote?.lines.find((q) => q.key === l.key);
                return (
                  <li key={l.key} className="flex gap-3">
                    <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-lg bg-ink-700">
                      {l.image && <Image src={l.image} alt="" fill sizes="56px" className="object-cover" unoptimized={l.image.endsWith(".svg")} />}
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-bone px-1 text-[10px] font-bold text-ink">{l.quantity}</span>
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate text-bone">{l.name}</p>
                      <p className="text-bone-muted">Taille {l.size}</p>
                      <p className="text-bone-muted">{l.customization ? <>Flocage <span className="text-bone">{l.customization.name} · {l.customization.number}</span></> : "Sans flocage"}</p>
                      {server?.error && <p className="text-signal">{server.error}</p>}
                    </div>
                    <p className="text-sm">{formatPrice((l.unitPrice + l.customizationPrice) * l.quantity)}</p>
                  </li>
                );
              })}
            </ul>
            <PromoCodeField applied={quote?.promoCode ?? null} error={quote?.promoError ?? null} />
            {quote && <OrderSummary quote={quote} shippingLabel={method?.name} loading={loading} />}

            <div className="space-y-3 border-t border-ink-600 pt-5 text-sm">
              <label className="flex items-start gap-3 text-bone-muted">
                <input type="checkbox" className="mt-0.5 accent-[#D6B36A]" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} required />
                <span>J&apos;accepte les <Link href="/pages/cgv" target="_blank" className="underline">conditions générales de vente</Link>{hasCustom && <> et je comprends que les <strong className="text-bone">articles floqués ne sont ni repris ni échangés</strong></>}.</span>
              </label>
              <label className="flex items-start gap-3 text-bone-dim">
                <input type="checkbox" className="mt-0.5 accent-[#D6B36A]" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
                <span>M&apos;envoyer un seul rappel par e-mail si je ne finalise pas ma commande (facultatif).</span>
              </label>
            </div>

            {error && <p className="rounded-xl bg-signal/10 px-4 py-3 text-sm text-signal" role="alert">{error}</p>}
            <button type="submit" disabled={submitting || !quote || quote.hasErrors || !methodId || !paymentsEnabled} className="btn-primary w-full py-4 text-[13px]">
              {submitting ? "Redirection vers le paiement…" : quote ? `Payer ${formatPrice(quote.total)}` : "Calcul…"}
            </button>
            <p className="flex items-center justify-center gap-2 text-center text-xs text-bone-dim"><IconShield width={16} height={16} /> Paiement sécurisé Stripe{paymentMethods.length > 0 && ` · ${paymentMethods.join(", ")}`}</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
