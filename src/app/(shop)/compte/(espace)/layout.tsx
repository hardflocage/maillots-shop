import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/actions/account";

const NAV = [
  ["/compte", "Mes commandes"],
  ["/compte/favoris", "Favoris"],
  ["/compte/adresses", "Adresses"],
  ["/compte/profil", "Informations"],
  ["/contact", "Service client"],
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="container-x py-10 sm:py-14">
      <p className="eyebrow mb-3">Mon compte</p>
      <h1 className="h-display text-5xl sm:text-6xl">Salut {user.name?.split(" ")[0] ?? ""}</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0" aria-label="Espace client">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="shrink-0 rounded-full border border-ink-500 px-4 py-2.5 text-sm text-bone-muted hover:text-bone lg:rounded-xl">{label}</Link>
          ))}
          {user.role === "ADMIN" && <Link href="/admin" className="shrink-0 rounded-full border border-gold/40 px-4 py-2.5 text-sm text-gold lg:rounded-xl">Administration</Link>}
          <form action={logout}><button className="shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-sm text-bone-dim hover:text-signal lg:rounded-xl">Se déconnecter</button></form>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
