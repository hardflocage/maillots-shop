import type { Metadata } from "next";
import { RegisterForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <RegisterForm next={(await searchParams).next} />;
}
