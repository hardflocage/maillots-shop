"use client";

import { useState } from "react";
import type { Category, Player, Product, Variant } from "@prisma/client";
import { saveProduct } from "@/app/actions/admin";
import { centsToInput } from "@/lib/format";
import { CATEGORY_TYPE_LABELS, KIT_LABELS } from "@/lib/labels";
import { ActionForm } from "./ActionForm";
import { Check, Field } from "./ui";

const PRESETS: Record<string, string[]> = {
  Adultes: ["S", "M", "L", "XL", "XXL", "3XL"],
  Enfants: ["6 ans", "8 ans", "10 ans", "12 ans", "14 ans"],
};

type V = { id?: string; size: string; stock: number; lowStockThreshold: number };

export function ProductForm({ product, categories }: { product?: Product & { variants: Variant[]; players: Player[]; categories: { id: string }[] }; categories: Category[] }) {
  const p = product;
  const [variants, setVariants] = useState<V[]>(p?.variants.map((v) => ({ id: v.id, size: v.size, stock: v.stock, lowStockThreshold: v.lowStockThreshold })) ?? PRESETS.Adultes.map((s) => ({ size: s, stock: 0, lowStockThreshold: 2 })));
  const [players, setPlayers] = useState(p?.players.map((pl) => ({ name: pl.name, number: pl.number })) ?? []);
  const [custom, setCustom] = useState(p?.customizationEnabled ?? true);
  const selected = new Set(p?.categories.map((c) => c.id));

  const upd = (i: number, patch: Partial<V>) => setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const addPreset = (name: string) => setVariants((vs) => [...vs, ...PRESETS[name].filter((s) => !vs.some((v) => v.size === s)).map((s) => ({ size: s, stock: 0, lowStockThreshold: 2 }))]);

  return (
    <ActionForm action={saveProduct} className="space-y-8" submitLabel={p ? "Enregistrer les modifications" : "Créer le produit"}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <input type="hidden" name="players" value={JSON.stringify(players)} />

      <section className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <h2 className="font-semibold sm:col-span-2">Informations</h2>
        <Field label="Nom du produit" className="sm:col-span-2"><input name="name" required defaultValue={p?.name} className="input" placeholder="Real Madrid Domicile 2025/26" /></Field>
        <Field label="Club ou sélection"><input name="club" required defaultValue={p?.club} className="input" placeholder="Real Madrid" /></Field>
        <Field label="Saison"><input name="season" required defaultValue={p?.season} className="input" placeholder="2025/26" /></Field>
        <Field label="Type de maillot">
          <select name="kitType" defaultValue={p?.kitType ?? "HOME"} className="input">
            {Object.entries(KIT_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <Field label="Adresse de la page (slug)" hint="Laisser vide pour la générer automatiquement"><input name="slug" defaultValue={p?.slug} className="input" /></Field>
        <Field label="Description complète" className="sm:col-span-2"><textarea name="description" rows={6} defaultValue={p?.description} className="input" placeholder="Matière, coupe, détails, entretien…" /></Field>
        <Field label="Délai / info livraison spécifique (facultatif)" className="sm:col-span-2" hint="Ex. « Expédié sous 48 h ». N'indiquez que des délais que vous pouvez tenir."><input name="deliveryInfo" defaultValue={p?.deliveryInfo ?? ""} className="input" /></Field>
      </section>

      <section className="card grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
        <h2 className="font-semibold sm:col-span-3">Prix</h2>
        <Field label="Prix de vente (€)"><input name="price" required inputMode="decimal" defaultValue={centsToInput(p?.price)} className="input" placeholder="89,90" /></Field>
        <Field label="Prix barré (€)" hint="Renseignez-le pour mettre le produit en promotion"><input name="compareAtPrice" inputMode="decimal" defaultValue={centsToInput(p?.compareAtPrice)} className="input" /></Field>
        <div className="flex flex-col justify-center gap-3">
          <Check name="isActive" label="Visible sur la boutique" defaultChecked={p?.isActive ?? true} />
          <Check name="isNew" label="Nouveauté" defaultChecked={p?.isNew} />
          <Check name="isFeatured" label="Tendance (mis en avant)" defaultChecked={p?.isFeatured} />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Tailles et stock</h2>
          <div className="flex gap-2">
            {Object.keys(PRESETS).map((k) => <button type="button" key={k} onClick={() => addPreset(k)} className="rounded-full border border-ink-500 px-3 py-1.5 text-xs text-bone-muted hover:text-bone">+ Tailles {k.toLowerCase()}</button>)}
            <button type="button" onClick={() => setVariants((v) => [...v, { size: "", stock: 0, lowStockThreshold: 2 }])} className="rounded-full border border-ink-500 px-3 py-1.5 text-xs text-bone-muted hover:text-bone">+ Taille</button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 text-xs uppercase tracking-wider text-bone-dim"><span>Taille</span><span>Stock</span><span>Alerte si ≤</span><span /></div>
          {variants.map((v, i) => (
            <div key={v.id ?? i} className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2">
              <input value={v.size} onChange={(e) => upd(i, { size: e.target.value })} className="input py-2" required aria-label="Taille" />
              <input type="number" min={0} value={v.stock} onChange={(e) => upd(i, { stock: Math.max(0, parseInt(e.target.value || "0", 10)) })} className={`input py-2 ${v.stock === 0 ? "border-signal/50" : ""}`} aria-label={`Stock ${v.size}`} />
              <input type="number" min={0} value={v.lowStockThreshold} onChange={(e) => upd(i, { lowStockThreshold: Math.max(0, parseInt(e.target.value || "0", 10)) })} className="input py-2" aria-label="Seuil d'alerte" />
              <button type="button" onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))} className="text-bone-dim hover:text-signal" aria-label="Supprimer la taille">✕</button>
            </div>
          ))}
          <p className="pt-1 text-xs text-bone-dim">Stock total : {variants.reduce((s, v) => s + v.stock, 0)} · Une taille à 0 apparaît « épuisée » et ne peut pas être commandée.</p>
        </div>
      </section>

      <section className="card space-y-4 p-5 sm:p-6">
        <h2 className="font-semibold">Flocage</h2>
        <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" name="customizationEnabled" checked={custom} onChange={(e) => setCustom(e.target.checked)} className="h-4 w-4 accent-[#D6B36A]" /> Proposer le flocage pour ce maillot</label>
        {custom && (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Supplément (€)"><input name="customizationPrice" inputMode="decimal" defaultValue={centsToInput(p?.customizationPrice ?? 1500)} className="input" /></Field>
              <Field label="Nom : caractères max"><input name="maxNameLength" type="number" min={3} max={20} defaultValue={p?.maxNameLength ?? 12} className="input" /></Field>
              <Field label="Couleur de l'aperçu"><input name="flockingColor" type="color" defaultValue={p?.flockingColor ?? "#FFFFFF"} className="input h-[50px] p-1" /></Field>
              <Field label="Hauteur de l'aperçu (%)" hint="Position du nom sur la photo de dos"><input name="flockingTop" type="number" min={5} max={60} defaultValue={p?.flockingTop ?? 22} className="input" /></Field>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-bone-muted">Joueurs prédéfinis (facultatif)</p>
                <button type="button" onClick={() => setPlayers((pl) => [...pl, { name: "", number: 10 }])} className="rounded-full border border-ink-500 px-3 py-1.5 text-xs text-bone-muted hover:text-bone">+ Joueur</button>
              </div>
              <div className="space-y-2">
                {players.map((pl, i) => (
                  <div key={i} className="grid grid-cols-[1fr_100px_40px] gap-2">
                    <input value={pl.name} onChange={(e) => setPlayers((ps) => ps.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="input py-2 uppercase" placeholder="NOM" required />
                    <input type="number" min={0} max={99} value={pl.number} onChange={(e) => setPlayers((ps) => ps.map((x, j) => (j === i ? { ...x, number: parseInt(e.target.value || "0", 10) } : x)))} className="input py-2" />
                    <button type="button" onClick={() => setPlayers((ps) => ps.filter((_, j) => j !== i))} className="text-bone-dim hover:text-signal" aria-label="Retirer">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {!custom && <input type="hidden" name="customizationPrice" value={centsToInput(p?.customizationPrice ?? 1500)} />}
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-semibold">Catégories</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2.5 rounded-lg border border-ink-600 px-3 py-2.5 text-sm">
              <input type="checkbox" name="categories" value={c.id} defaultChecked={selected.has(c.id)} className="h-4 w-4 accent-[#D6B36A]" />
              {c.name} <span className="ml-auto text-[11px] text-bone-dim">{CATEGORY_TYPE_LABELS[c.type]}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="card grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
        <h2 className="font-semibold sm:col-span-3">Photos {p && <span className="text-sm font-normal text-bone-dim">(remplace la photo existante du même type)</span>}</h2>
        <Field label="Photo DEVANT" hint="JPG/PNG/WEBP, format portrait 4:5 conseillé (ex. 1600×2000)"><input type="file" name="frontImage" accept="image/jpeg,image/png,image/webp,image/avif" className="input py-2 text-sm" /></Field>
        <Field label="Photo DOS" hint="La vraie photo du dos du maillot vendu"><input type="file" name="backImage" accept="image/jpeg,image/png,image/webp,image/avif" className="input py-2 text-sm" /></Field>
        <Field label="Photos supplémentaires" hint="Plusieurs fichiers possibles"><input type="file" name="extraImages" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="input py-2 text-sm" /></Field>
      </section>
    </ActionForm>
  );
}
