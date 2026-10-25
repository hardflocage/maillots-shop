import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user && (!next?.startsWith("/admin") || user.role === "ADMIN")) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/compte");
  return <LoginForm next={next} />;
}
