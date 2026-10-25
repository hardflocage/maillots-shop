import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <div className="container-x grid max-w-5xl gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <h1 className="h-display text-5xl sm:text-6xl">Contact</h1>
        <p className="mt-4 text-bone-muted">Une question sur une taille, un flocage ou une commande ? Écris-nous.</p>
        <div className="mt-8 space-y-3 text-sm text-bone-muted">
          {s.contactEmail && <p>E-mail : <a className="text-bone underline" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></p>}
          {s.contactPhone && <p>Téléphone : <a className="text-bone" href={`tel:${s.contactPhone.replace(/\s/g, "")}`}>{s.contactPhone}</a></p>}
          {s.contactAddress && <p className="whitespace-pre-line">{s.contactAddress}</p>}
        </div>
      </div>
      <ContactForm />
    </div>
  );
}
