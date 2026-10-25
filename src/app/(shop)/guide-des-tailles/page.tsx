import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContentPage } from "@/components/layout/ContentPage";

export const metadata: Metadata = { title: "Guide des tailles" };

export default async function Page() {
  const page = await prisma.page.findUnique({ where: { slug: "guide-des-tailles" } });
  if (!page) notFound();
  return <ContentPage title={page.title} content={page.content} updatedAt={page.updatedAt} />;
}
