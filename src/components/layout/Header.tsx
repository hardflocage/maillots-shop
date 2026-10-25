import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const [settings, categories, user] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { name: true, slug: true, type: true } }),
    getCurrentUser(),
  ]);
  return (
    <HeaderClient
      shopName={settings.shopName}
      announcement={settings.announcement}
      categories={categories}
      user={user ? { name: user.name, isAdmin: user.role === "ADMIN" } : null}
    />
  );
}
