import type { Metadata } from "next";
import { CartPageClient } from "./CartPageClient";

export const metadata: Metadata = { title: "Panier", robots: { index: false } };

export default function CartPage() {
  return <CartPageClient />;
}
