import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/format";

export function ContentPage({ title, content, updatedAt, children }: { title: string; content: string; updatedAt?: Date; children?: React.ReactNode }) {
  return (
    <div className="container-x max-w-3xl py-14 sm:py-20">
      <h1 className="h-display text-5xl sm:text-6xl">{title}</h1>
      {updatedAt && <p className="mt-3 text-xs uppercase tracking-[0.16em] text-bone-dim">Mis à jour le {formatDate(updatedAt)}</p>}
      <div className="prose-shop mt-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      {children}
    </div>
  );
}
