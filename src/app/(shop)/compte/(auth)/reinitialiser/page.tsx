import type { Metadata } from "next";
import { ResetForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  return <ResetForm token={(await searchParams).token ?? ""} />;
}
