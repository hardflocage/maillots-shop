import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { bestSellers, listProducts, saleProducts } from "@/lib/catalog";
import { primaryImage } from "@/lib/products";
import { ProductRail } from "@/components/product/ProductRail";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { IconArrowRight, IconReturn, IconShield, IconShirt, IconStar, IconTruck } from "@/components/ui/Icons";
import { formatDate, formatPrice } from "@/lib/format";
import { activePaymentMethods } from "@/lib/content";
import { KIT_LABELS } from "@/lib/labels";
import { backImage, isOnSale } from "@/lib/products";
import { QuickViewButton } from "@/components/product/QuickView";


export default async function HomePage() {
  const [settings, newest, featured, best, sales, leagues, national, retro, reviews] = await Promise.all([
    getSettings(),
    listProducts({ isNew: true }, { take: 8 }).then(async (r) => (r.length ? r : listProducts({}, { take: 8 }))),
    listProducts({ isFeatured: true }, { take: 8 }),
    bestSellers(8),
    saleProducts(8),
    prisma.category.findMany({ where: { isActive: true, showOnHome: true }, orderBy: { sortOrder: "asc" }, include: { products: { where: { isActive: true }, take: 1, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], include: { images: true } }, _count: { select: { products: { where: { isActive: true } } } } } }),
    listProducts({ categories: { some: { type: "NATIONAL" } } }, { take: 8 }),
    listProducts({ categories: { some: { type: "RETRO" } } }, { take: 8 }),
    prisma.review.findMany({ where: { status: "APPROVED" }, include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const heroProduct = (featured.length ? featured : newest).find((p) => p.images.length > 0) ?? null;
  const heroImage = settings.heroImageUrl;
  const payments = activePaymentMethods(settings);
  // Collections : uniquement celles qui ont des maillots ou une photo (jamais de case vide)
  const collections = leagues.filter((c) => c._count.products > 0 || c.imageUrl);
  const leagueNames = leagues.filter((c) => c.type === "LEAGUE" || c.type === "COMPETITION");
  const catalogEmpty = newest.length === 0;

  return (
    <>
      {/* HERO */}
      <section className="relative -mt-16 overflow-hidden lg:-mt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(214,179,106,0.16),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_10%_90%,rgba(255,255,255,0.05),transparent_60%)]" />
          <div className="grain absolute inset-0" />
        </div>
        {heroImage && (
          <div className="absolute inset-0">
            <Image src={heroImage} alt="" fill priority sizes="100vw" className="object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
          </div>
        )}
        <div className="container-x relative grid min-h-[92svh] items-center gap-10 pb-16 pt-28 lg:grid-cols-[1.1fr_1fr] lg:pt-32">
          <div className="animate-fade-up">
            <p className="eyebrow mb-6">{settings.tagline}</p>
            <h1 className="h-display text-[17vw] sm:text-[12vw] lg:text-[8.5vw] xl:text-[132px]">
              {settings.heroTitle.split(" ").map((w, i, a) => (
                <span key={i} className={i === a.length - 1 ? "text-gold" : ""}>{w}{i < a.length - 1 ? " " : ""}</span>
              ))}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-bone-muted sm:text-lg">{settings.heroSubtitle}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/boutique" className="btn-primary px-8 py-4 text-[13px]">Découvrir les maillots <IconArrowRight width={18} height={18} /></Link>
              <Link href="/boutique?tri=nouveautes" className="btn-ghost px-8 py-4 text-[13px]">Nouveautés</Link>
            </div>
          </div>
          {heroProduct && (
            <HeroJersey product={heroProduct} />
          )}
        </div>
      </section>

      {/* BANDEAU CHAMPIONNATS */}
      {leagueNames.length > 0 && !catalogEmpty && (
        <div className="overflow-hidden border-y border-ink-600 bg-ink-900 py-5">
          <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
            {[...leagueNames, ...leagueNames, ...leagueNames, ...leagueNames].map((c, i) => (
              <Link key={i} href={`/collections/${c.slug}`} className="font-display text-2xl uppercase tracking-wider text-bone-dim transition hover:text-bone">
                {c.name} <span className="ml-12 text-gold">✦</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ProductRail eyebrow="Fraîchement arrivés" title="Nouveautés" href="/boutique?tri=nouveautes" products={newest} />
      <ProductRail eyebrow="Les plus commandés" title="Meilleures ventes" href="/boutique?tri=ventes" products={best} />
      <ProductRail eyebrow="En ce moment" title="Tendances" href="/boutique?tendance=1" products={featured} />

      {catalogEmpty && (
        <section className="container-x py-16 sm:py-24">
          <div className="relative overflow-hidden rounded-3xl border border-ink-600 bg-gradient-to-br from-ink-800 to-ink-900 p-8 text-center sm:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(214,179,106,0.12),transparent_70%)]" />
            <p className="eyebrow relative mb-4">Ouverture prochaine</p>
            <h2 className="h-display relative text-4xl sm:text-6xl">Le vestiaire se remplit</h2>
            <p className="relative mx-auto mt-5 max-w-lg leading-relaxed text-bone-muted">Les premiers maillots arrivent très bientôt. Inscris-toi pour être prévenu de leur mise en ligne.</p>
          </div>
        </section>
      )}

      {/* COLLECTIONS PAR CHAMPIONNAT */}
      {collections.length > 0 && (
        <section className="container-x py-14 sm:py-20">
          <p className="eyebrow mb-3">Collections</p>
          <h2 className="h-display mb-10 text-4xl sm:text-5xl lg:text-6xl">Choisis ton camp</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {collections.map((c, i) => {
              const img = c.imageUrl ?? (c.products[0] ? primaryImage(c.products[0].images) : null);
              return (
                <Link key={c.id} href={`/collections/${c.slug}`} className={`group relative overflow-hidden rounded-2xl border border-ink-600 bg-gradient-to-br from-ink-700 to-ink-900 ${i === 0 ? "col-span-2 aspect-[2/1] lg:col-span-1 lg:row-span-2 lg:aspect-auto" : "aspect-[4/3]"}`}>
                  {img && <Image src={img} alt="" fill sizes="(min-width:1024px) 33vw, 50vw" className="object-cover opacity-60 transition duration-700 group-hover:scale-105 group-hover:opacity-80" unoptimized={img.endsWith(".svg")} />}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                  <span className="absolute right-4 top-4 rounded-full border border-bone/20 p-2 text-bone opacity-0 transition group-hover:opacity-100"><IconArrowRight width={16} height={16} /></span>
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-bone-muted">{c._count.products > 0 ? `${c._count.products} maillot${c._count.products > 1 ? "s" : ""}` : "Bientôt disponible"}</p>
                    <p className="h-display mt-1 text-2xl sm:text-4xl">{c.name}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <ProductRail eyebrow="Fiertés nationales" title="Sélections" href="/collections/selections-nationales" products={national} />

      {/* RÉTRO : bloc éditorial */}
      {retro.length > 0 && (
        <section className="relative my-10 overflow-hidden border-y border-ink-600 bg-ink-900">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_0%_50%,rgba(214,179,106,0.10),transparent_60%)]" />
          <div className="container-x relative grid gap-10 py-16 lg:grid-cols-[1fr_2fr] lg:py-24">
            <div className="flex flex-col justify-center">
              <p className="eyebrow mb-4">Héritage</p>
              <h2 className="h-display text-5xl sm:text-6xl lg:text-7xl">Maillots<br />rétro</h2>
              <p className="mt-5 max-w-sm leading-relaxed text-bone-muted">Les tuniques qui ont marqué l&apos;histoire du football. Des pièces de collection à porter.</p>
              <Link href="/collections/retro" className="btn-light mt-8 self-start">Explorer le rétro</Link>
            </div>
            <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
              {retro.slice(0, 3).map((p) => {
                const img = primaryImage(p.images);
                return (
                  <Link key={p.id} href={`/maillot/${p.slug}`} className="group w-[60%] shrink-0 snap-start sm:w-auto">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-800">
                      {img && <Image src={img} alt={p.name} fill sizes="(min-width:640px) 22vw, 60vw" className="object-cover transition duration-700 group-hover:scale-105" unoptimized={img.endsWith(".svg")} />}
                    </div>
                    <p className="mt-3 text-sm text-bone">{p.name}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <ProductRail eyebrow="Prix réduits" title="Promotions" href="/boutique?promo=1" products={sales} />

      {/* ENGAGEMENTS */}
      <section className="container-x py-14">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink-600 bg-ink-600 lg:grid-cols-4">
          {[
            { icon: IconShield, t: "Paiement sécurisé", d: `${payments.length ? `${payments.join(", ")} via Stripe.` : "Paiement traité par Stripe."} Aucune donnée bancaire stockée chez nous.` },
            { icon: IconShirt, t: "Flocage personnalisé", d: "Ton nom et ton numéro, avec un récapitulatif avant paiement." },
            { icon: IconTruck, t: "Suivi de commande", d: "Numéro de suivi transmis dès l'expédition." },
            { icon: IconReturn, t: `Retours sous ${settings.returnDays} jours`, d: "Pour les articles non floqués. Procédure simple depuis ton espace client." },
          ].map(({ icon: I, t, d }) => (
            <div key={t} className="bg-ink-900 p-6 sm:p-8">
              <I className="text-gold" />
              <p className="mt-4 font-semibold">{t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-bone-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AVIS CLIENTS : uniquement des avis réels, vérifiés et modérés */}
      {reviews.length > 0 && (
      <section className="container-x py-14 sm:py-20">
        <p className="eyebrow mb-3">Ils les portent</p>
        <h2 className="h-display mb-10 text-4xl sm:text-5xl lg:text-6xl">Avis clients</h2>
        {(
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="card flex flex-col p-6">
                <div className="flex gap-0.5 text-gold" aria-label={`${r.rating} sur 5`}>
                  {Array.from({ length: 5 }).map((_, i) => <IconStar key={i} width={16} height={16} fill={i < r.rating ? "currentColor" : "none"} />)}
                </div>
                {r.title && <p className="mt-4 font-semibold">{r.title}</p>}
                <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-bone-muted">« {r.body} »</blockquote>
                <figcaption className="mt-5 text-xs text-bone-dim">
                  {r.user.name?.split(" ")[0] ?? "Client"} · Achat vérifié · <Link href={`/maillot/${r.product.slug}`} className="underline">{r.product.name}</Link> · {formatDate(r.createdAt)}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
      )}

      {/* PRÉSENTATION */}
      {settings.aboutText.trim() && (
      <section className="container-x py-14 sm:py-20">
        <div className="grid gap-10 rounded-3xl border border-ink-600 bg-gradient-to-br from-ink-800 to-ink-900 p-8 sm:p-14 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-4">À propos</p>
            <h2 className="h-display text-4xl sm:text-5xl">{settings.aboutTitle}</h2>
          </div>
          <div className="space-y-4 text-bone-muted">
            {settings.aboutText.split(/\n+/).map((p, i) => <p key={i} className="leading-relaxed">{p}</p>)}
            <Link href="/pages/a-propos" className="inline-flex items-center gap-2 pt-2 text-sm font-semibold uppercase tracking-wider text-gold">En savoir plus <IconArrowRight width={16} height={16} /></Link>
          </div>
        </div>
      </section>
      )}

      {/* NEWSLETTER */}
      <section className="container-x pb-10 pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gold p-8 text-ink sm:p-14">
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="h-display text-4xl sm:text-6xl">Ne rate aucune sortie</h2>
              <p className="mt-3 max-w-md text-ink/70">Nouveaux maillots, réassorts et offres réservées aux inscrits.</p>
            </div>
            <div className="[&_.input]:border-ink/20 [&_.input]:bg-white/60 [&_.input]:text-ink [&_.input]:placeholder:text-ink/50 [&_.btn-primary]:bg-ink [&_.btn-primary]:text-bone [&_label]:text-ink/70">
              <NewsletterForm source="home" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

type HeroProduct = Awaited<ReturnType<typeof listProducts>>[number];

/** Maillot vedette de l'accueil : grande photo, devant/dos au survol, prix et achat direct. */
function HeroJersey({ product }: { product: HeroProduct }) {
  const front = primaryImage(product.images);
  const back = backImage(product.images);
  const sale = isOnSale(product);
  const svg = (u: string | null) => Boolean(u?.endsWith(".svg"));
  return (
    <div className="relative mx-auto w-full max-w-[520px] animate-fade-up [animation-delay:150ms]">
      <div className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle,rgba(214,179,106,0.22),transparent_65%)] blur-2xl" aria-hidden />
      <div className="group relative">
        <Link href={`/maillot/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-ink-700 to-ink-800 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9)]">
          {front && <Image src={front} alt={`${product.name} : devant`} fill priority sizes="(min-width:1024px) 520px, 90vw" className={`object-cover transition duration-700 group-hover:scale-[1.03] ${back ? "group-hover:opacity-0" : ""}`} unoptimized={svg(front)} />}
          {back && <Image src={back} alt={`${product.name} : dos`} fill sizes="(min-width:1024px) 520px, 90vw" className="object-cover opacity-0 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-100" unoptimized={svg(back)} />}
          <span className="absolute left-5 top-5 rounded-full bg-ink/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gold backdrop-blur">Maillot vedette</span>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/80 to-transparent p-5 pt-20 sm:p-7 sm:pt-24">
            <p className="text-[11px] uppercase tracking-[0.2em] text-bone-muted">{product.club} · {product.season} · {KIT_LABELS[product.kitType]}</p>
            <p className="mt-1 font-display text-2xl uppercase leading-none sm:text-3xl">{product.name}</p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className={`text-xl font-semibold ${sale ? "text-signal" : ""}`}>{formatPrice(product.price)}</span>
              {sale && <span className="text-sm text-bone-dim line-through">{formatPrice(product.compareAtPrice!)}</span>}
            </p>
          </div>
        </Link>
        <div className="absolute bottom-5 right-5 flex items-center gap-2 sm:bottom-7 sm:right-7">
          <QuickViewButton slug={product.slug} name={product.name} />
        </div>
      </div>
    </div>
  );
}
