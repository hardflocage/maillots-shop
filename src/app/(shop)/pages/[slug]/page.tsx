import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContentPage } from "@/components/layout/ContentPage";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await prisma.page.findUnique({ where: { slug: (await params).slug } });
  return p ? { title: p.title } : {};
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = await prisma.page.findUnique({ where: { slug: (await params).slug } });
  if (!page) notFound();
  return <ContentPage title={page.title} content={page.content} updatedAt={page.updatedAt} />;
}
