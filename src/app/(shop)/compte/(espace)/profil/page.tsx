import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Mes informations", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireUser();
  return <ProfileForm user={{ name: user.name ?? "", email: user.email, phone: user.phone ?? "" }} />;
}
