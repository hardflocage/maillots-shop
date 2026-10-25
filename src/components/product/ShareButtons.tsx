"use client";

import { useEffect, useState } from "react";
import { IconShare } from "@/components/ui/Icons";

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [href, setHref] = useState("");
  useEffect(() => setHref(window.location.href), []);
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const enc = (s: string) => encodeURIComponent(s);
  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-bone-muted">
      <button onClick={share} className="flex items-center gap-2 rounded-full border border-ink-500 px-4 py-2.5 hover:text-bone">
        <IconShare width={16} height={16} /> {copied ? "Lien copié" : "Partager"}
      </button>
      <a className="rounded-full border border-ink-500 px-3 py-2.5 hover:text-bone" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${enc(`${title} ${href}`)}`}>WhatsApp</a>
      <a className="hidden rounded-full border border-ink-500 px-3 py-2.5 hover:text-bone sm:inline" target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${enc(href)}`}>Facebook</a>
    </div>
  );
}
