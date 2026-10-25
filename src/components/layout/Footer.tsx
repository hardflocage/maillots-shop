import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { NewsletterForm } from "./NewsletterForm";
import { IconInstagram, IconTiktok } from "@/components/ui/Icons";
import { CookieSettingsLink } from "./CookieConsent";
import { PaymentBadges } from "@/components/ui/PaymentBadges";
import { activePaymentMethods } from "@/lib/content";

export async function Footer() {
  const s = await getSettings();
  const year = new Date().getFullYear();
  const payments = activePaymentMethods(s);
  return (
    <footer className="mt-24 border-t border-ink-600 bg-ink-900">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-md">
          <p className="font-display text-3xl tracking-[0.18em]">{s.shopName}</p>
          <p className="mt-3 text-sm leading-relaxed text-bone-muted">{s.tagline}</p>
          <div className="mt-6"><NewsletterForm /></div>
          <div className="mt-6 flex gap-3">
            {s.instagramUrl && <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full border border-ink-500 p-2.5 text-bone-muted hover:text-bone"><IconInstagram width={18} height={18} /></a>}
            {s.tiktokUrl && <a href={s.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="rounded-full border border-ink-500 p-2.5 text-bone-muted hover:text-bone"><IconTiktok width={18} height={18} /></a>}
          </div>
        </div>
        <div>
          <p className="eyebrow mb-4">Boutique</p>
          <ul className="space-y-3 text-sm text-bone-muted">
            <li><Link href="/boutique" className="hover:text-bone">Tous les maillots</Link></li>
            <li><Link href="/boutique?tri=nouveautes" className="hover:text-bone">Nouveautés</Link></li>
            <li><Link href="/boutique?promo=1" className="hover:text-bone">Promotions</Link></li>
            <li><Link href="/collections/retro" className="hover:text-bone">Maillots rétro</Link></li>
            <li><Link href="/guide-des-tailles" className="hover:text-bone">Guide des tailles</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">Aide</p>
          <ul className="space-y-3 text-sm text-bone-muted">
            <li><Link href="/suivi" className="hover:text-bone">Suivre ma commande</Link></li>
            <li><Link href="/faq" className="hover:text-bone">FAQ</Link></li>
            <li><Link href="/pages/livraison" className="hover:text-bone">Livraison</Link></li>
            <li><Link href="/pages/retours" className="hover:text-bone">Retours & remboursements</Link></li>
            <li><Link href="/contact" className="hover:text-bone">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">Informations</p>
          <ul className="space-y-3 text-sm text-bone-muted">
            <li><Link href="/pages/a-propos" className="hover:text-bone">À propos</Link></li>
            <li><Link href="/pages/mentions-legales" className="hover:text-bone">Mentions légales</Link></li>
            <li><Link href="/pages/cgv" className="hover:text-bone">Conditions générales de vente</Link></li>
            <li><Link href="/pages/confidentialite" className="hover:text-bone">Politique de confidentialité</Link></li>
            <li><CookieSettingsLink /></li>
          </ul>
          {(s.contactEmail || s.contactPhone) && (
            <div className="mt-6 space-y-1 text-sm text-bone-muted">
              {s.contactEmail && <p><a href={`mailto:${s.contactEmail}`} className="hover:text-bone">{s.contactEmail}</a></p>}
              {s.contactPhone && <p><a href={`tel:${s.contactPhone.replace(/\s/g, "")}`} className="hover:text-bone">{s.contactPhone}</a></p>}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-ink-600">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-bone-dim sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {s.shopName}. Tous droits réservés.</p>
          {payments.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span>Paiement sécurisé par Stripe</span>
              <PaymentBadges methods={payments} />
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
