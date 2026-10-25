import type { Metadata } from "next";
import { ForgotForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function Page() {
  return <ForgotForm />;
}
