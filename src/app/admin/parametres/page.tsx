import Image from "next/image";
import { getSettings, integrationStatus } from "@/lib/settings";
import { saveSettings } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/ActionForm";
import { Check, Field, PageTitle } from "@/components/admin/ui";

export default async function SettingsAdmin() {
  const s = await getSettings();
  const integ = integrationStatus();
  const row = (ok: boolean, label: string, help: string) => (
    <li className="flex items-start gap-3 py-2"><span className={ok ? "text-pitch" : "text-signal"}>{ok ? "●" : "○"}</span><span><strong>{label}</strong> : {ok ? "configuré" : "non configuré"}<span className="block text-xs text-bone-dim">{help}</span></span></li>
  );
  return (
    <div className="max-w-4xl space-y-8">
      <PageTitle title="Paramètres" />
      <section className="card p-5">
        <h2 className="mb-2 font-semibold">Services connectés</h2>
        <ul className="divide-y divide-ink-600 text-sm">
          {row(integ.stripe, `Stripe${integ.stripe ? (integ.stripeLive ? " (mode réel)" : " (mode test)") : ""}`, "STRIPE_SECRET_KEY : encaissement par carte, Apple Pay, Google Pay")}
          {row(integ.stripeWebhook, "Webhook Stripe", "STRIPE_WEBHOOK_SECRET : confirmation automatique des paiements")}
          {row(integ.email, "E-mails (Resend)", "RESEND_API_KEY + EMAIL_FROM : confirmations, expéditions, mot de passe")}
          {row(integ.storage, "Stockage photos (Supabase)", "NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY")}
          {row(integ.cron, "Tâches planifiées", "CRON_SECRET : libération des stocks expirés, rappels de panier")}
        </ul>
        <p className="mt-3 text-xs text-bone-dim">Ces clés se règlent dans les variables d&apos;environnement de l&apos;hébergeur (voir DEPLOIEMENT.md), jamais dans le code.</p>
      </section>

      <ActionForm action={saveSettings} className="space-y-6">
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">Identité</h2>
          <Field label="Nom de la boutique"><input name="shopName" defaultValue={s.shopName} className="input" /></Field>
          <Field label="Slogan"><input name="tagline" defaultValue={s.tagline} className="input" /></Field>
          <Field label="Bandeau d'annonce (haut de page)" className="sm:col-span-2" hint="Vide = pas de bandeau"><input name="announcement" defaultValue={s.announcement ?? ""} className="input" /></Field>
        </section>
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">Page d&apos;accueil</h2>
          <Field label="Grand titre"><input name="heroTitle" defaultValue={s.heroTitle} className="input" /></Field>
          <Field label="Sous-titre"><input name="heroSubtitle" defaultValue={s.heroSubtitle} className="input" /></Field>
          <Field label="Image d'accueil (facultatif)" hint="Grande photo HD, format paysage. Sinon, vos maillots tendance sont mis en scène."><input type="file" name="heroImage" accept="image/jpeg,image/png,image/webp,image/avif" className="input py-2 text-sm" /></Field>
          {s.heroImageUrl && <div className="space-y-2"><div className="relative h-24 w-40 overflow-hidden rounded-lg"><Image src={s.heroImageUrl} alt="" fill className="object-cover" sizes="160px" /></div><Check name="removeHero" label="Retirer l'image" /></div>}
          <Field label="Titre « À propos »"><input name="aboutTitle" defaultValue={s.aboutTitle} className="input" /></Field>
          <Field label="Texte « À propos »" className="sm:col-span-2"><textarea name="aboutText" rows={4} defaultValue={s.aboutText} className="input" /></Field>
        </section>
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">Contact et réseaux</h2>
          <Field label="E-mail de contact (public)"><input name="contactEmail" type="email" defaultValue={s.contactEmail ?? ""} className="input" /></Field>
          <Field label="Téléphone (public)"><input name="contactPhone" defaultValue={s.contactPhone ?? ""} className="input" /></Field>
          <Field label="Adresse (publique)" className="sm:col-span-2"><textarea name="contactAddress" rows={2} defaultValue={s.contactAddress ?? ""} className="input" /></Field>
          <Field label="E-mail des alertes (commandes, stock bas, messages)"><input name="stockAlertEmail" type="email" defaultValue={s.stockAlertEmail ?? ""} className="input" /></Field>
          <div />
          <Field label="Instagram (https://…)"><input name="instagramUrl" defaultValue={s.instagramUrl ?? ""} className="input" /></Field>
          <Field label="TikTok (https://…)"><input name="tiktokUrl" defaultValue={s.tiktokUrl ?? ""} className="input" /></Field>
        </section>
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h2 className="font-semibold">Informations légales</h2>
            <p className="mt-1 text-xs text-bone-dim">Utilisées dans les mentions légales, les CGV et la politique de confidentialité. Une information vide n&apos;est jamais affichée.</p>
          </div>
          <Field label="Raison sociale (ou nom et prénom)"><input name="legalName" defaultValue={s.legalName ?? ""} className="input" /></Field>
          <Field label="Forme juridique" hint="Ex. micro-entreprise, SAS au capital de 1 000 €"><input name="legalForm" defaultValue={s.legalForm ?? ""} className="input" /></Field>
          <Field label="Adresse du siège" className="sm:col-span-2"><input name="legalAddress" defaultValue={s.legalAddress ?? ""} className="input" /></Field>
          <Field label="SIRET"><input name="siret" defaultValue={s.siret ?? ""} className="input" inputMode="numeric" /></Field>
          <Field label="N° TVA intracommunautaire" hint="Vide si non assujetti"><input name="vatNumber" defaultValue={s.vatNumber ?? ""} className="input" /></Field>
          <Field label="Directeur de la publication"><input name="publicationDirector" defaultValue={s.publicationDirector ?? ""} className="input" /></Field>
          <Field label="Médiateur de la consommation" hint="Nom et site du médiateur auquel vous adhérez"><input name="mediator" defaultValue={s.mediator ?? ""} className="input" /></Field>
          <Field label="Hébergeur" className="sm:col-span-2"><input name="hostInfo" defaultValue={s.hostInfo} className="input" /></Field>
        </section>
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">Retours</h2>
          <Field label="Délai de retour (jours après réception)" hint="14 jours minimum (droit de rétractation)"><input name="returnDays" type="number" min={14} max={365} defaultValue={s.returnDays} className="input" /></Field>
          <Field label="Adresse de retour"><input name="returnAddress" defaultValue={s.returnAddress ?? ""} className="input" /></Field>
        </section>
        <section className="card p-5">
          <h2 className="font-semibold">Moyens de paiement affichés</h2>
          <p className="mt-1 text-xs text-bone-dim">Cochez uniquement ceux réellement activés dans votre tableau de bord Stripe (Paramètres › Moyens de paiement). Rien n&apos;est affiché tant que Stripe n&apos;est pas branché.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Check name="payCard" label="Carte bancaire" defaultChecked={s.payCard} />
            <Check name="payApplePay" label="Apple Pay" defaultChecked={s.payApplePay} />
            <Check name="payGooglePay" label="Google Pay" defaultChecked={s.payGooglePay} />
            <Check name="payPaypal" label="PayPal" defaultChecked={s.payPaypal} />
          </div>
        </section>
      </ActionForm>
    </div>
  );
}
