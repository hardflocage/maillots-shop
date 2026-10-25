import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = { title: "Commande", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const [methods, address] = await Promise.all([
    prisma.shippingMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    user ? prisma.address.findFirst({ where: { userId: user.id }, orderBy: { isDefault: "desc" } }) : null,
  ]);
  return (
    <CheckoutClient
      paymentsEnabled={Boolean(process.env.STRIPE_SECRET_KEY)}
      methods={methods.map((m) => ({ id: m.id, name: m.name, description: m.description, type: m.type, price: m.price, freeOver: m.freeOver, deliveryTime: m.deliveryTime }))}
      defaults={{
        email: user?.email ?? "",
        firstName: address?.firstName ?? user?.name?.split(" ")[0] ?? "",
        lastName: address?.lastName ?? user?.name?.split(" ").slice(1).join(" ") ?? "",
        phone: address?.phone ?? user?.phone ?? "",
        line1: address?.line1 ?? "",
        line2: address?.line2 ?? "",
        postalCode: address?.postalCode ?? "",
        city: address?.city ?? "",
        country: address?.country ?? "FR",
      }}
      loggedIn={Boolean(user)}
    />
  );
}
