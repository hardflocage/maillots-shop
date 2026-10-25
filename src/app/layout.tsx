import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { getSettings, siteUrl } from "@/lib/settings";
import "./globals.css";

const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${s.shopName} · Maillots de football`, template: `%s · ${s.shopName}` },
    description: s.heroSubtitle,
    openGraph: { type: "website", siteName: s.shopName, locale: "fr_FR" },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = { themeColor: "#09090A", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
