import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CookieConsent } from "@/components/layout/CookieConsent";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-ink">Aller au contenu</a>
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
      <CartDrawer />
      <CookieConsent />
    </>
  );
}
