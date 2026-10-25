import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="h-display text-6xl sm:text-8xl">Hors-jeu</h1>
      <p className="max-w-md text-bone-muted">Cette page n&apos;existe pas ou a été déplacée.</p>
      <div className="flex gap-3">
        <Link href="/" className="btn-primary">Accueil</Link>
        <Link href="/boutique" className="btn-ghost">Boutique</Link>
      </div>
    </div>
  );
}
