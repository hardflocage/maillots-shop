import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContentPage } from "@/components/layout/ContentPage";

export const metadata: Metadata = { title: "Questions fréquentes" };

export default async function Page() {
  const page = await prisma.page.findUnique({ where: { slug: "faq" } });
  if (!page) notFound();
  return <ContentPage title={page.title} content={page.content} updatedAt={page.updatedAt} />;
}
