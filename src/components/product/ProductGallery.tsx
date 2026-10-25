"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight, IconClose, IconZoom } from "@/components/ui/Icons";

export type GalleryImage = { url: string; alt: string; kind: "FRONT" | "BACK" | "EXTRA" };
export type FlockingPreview = { name: string; number: string; color: string; top: number } | null;

function Flocking({ preview, large }: { preview: NonNullable<FlockingPreview>; large?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 [container-type:inline-size]" aria-hidden>
      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: `${preview.top}%`, color: preview.color }}>
        <span className="font-display uppercase leading-none tracking-[0.06em] [text-shadow:0_1px_2px_rgba(0,0,0,.25)]" style={{ fontSize: preview.name.length > 9 ? "5.2cqw" : "6.4cqw" }}>{preview.name}</span>
        <span className="mt-[1.5cqw] font-display leading-none [text-shadow:0_2px_3px_rgba(0,0,0,.25)]" style={{ fontSize: "22cqw" }}>{preview.number}</span>
      </div>
      <span className={`absolute left-4 top-4 whitespace-nowrap rounded-full bg-ink/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-bone backdrop-blur ${large ? "text-xs" : ""}`}>
        Aperçu simulé
      </span>
    </div>
  );
}

export function ProductGallery({ images, active, onChange, preview }: { images: GalleryImage[]; active: number; onChange: (i: number) => void; preview: FlockingPreview }) {
  const [lightbox, setLightbox] = useState(false);
  const [hoverZoom, setHoverZoom] = useState<{ x: number; y: number } | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const frontIndex = images.findIndex((i) => i.kind === "FRONT");
  const backIndex = images.findIndex((i) => i.kind === "BACK");
  const current = images[active] ?? images[0];
  const showPreview = preview && current?.kind === "BACK";

  const go = useCallback((dir: 1 | -1) => onChange((active + dir + images.length) % images.length), [active, images.length, onChange]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, go]);

  const onTouchStart = (e: React.TouchEvent) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY });
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  if (!current) {
    return <div className="flex aspect-[4/5] items-center justify-center rounded-3xl bg-ink-800 text-bone-dim">Photos à venir</div>;
  }

  return (
    <div className="lg:sticky lg:top-28">
      <div className="flex gap-4">
        {/* Miniatures (ordinateur) */}
        {images.length > 1 && (
          <div className="hidden w-20 shrink-0 flex-col gap-3 lg:flex">
            {images.map((img, i) => (
              <button key={img.url + i} onClick={() => onChange(i)} aria-label={`Afficher : ${img.alt}`} aria-current={i === active} className={`relative aspect-[4/5] overflow-hidden rounded-xl border transition ${i === active ? "border-gold" : "border-ink-600 opacity-60 hover:opacity-100"}`}>
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" unoptimized={img.url.endsWith(".svg")} />
              </button>
            ))}
          </div>
        )}

        <div className="relative min-w-0 flex-1">
          <div
            className="group relative aspect-[4/5] cursor-zoom-in touch-pan-y select-none overflow-hidden rounded-3xl bg-gradient-to-b from-ink-700 to-ink-800"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onMouseMove={(e) => {
              if (window.matchMedia("(hover: hover)").matches) {
                const r = e.currentTarget.getBoundingClientRect();
                setHoverZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
              }
            }}
            onMouseLeave={() => setHoverZoom(null)}
            onClick={() => setLightbox(true)}
          >
            {images.map((img, i) => (
              <div key={img.url + i} className={`absolute inset-0 transition-opacity duration-500 ease-out ${i === active ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={i !== active}>
                <div className="absolute inset-0 transition-transform duration-200 ease-out" style={i === active && hoverZoom && !showPreview ? { transform: "scale(1.9)", transformOrigin: `${hoverZoom.x}% ${hoverZoom.y}%` } : undefined}>
                  <Image src={img.url} alt={img.alt} fill priority={i === 0} sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" unoptimized={img.url.endsWith(".svg")} draggable={false} />
                  {i === active && showPreview && <Flocking preview={preview!} />}
                </div>
              </div>
            ))}
            <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-ink/60 p-2.5 text-bone opacity-80 backdrop-blur transition group-hover:opacity-100" aria-hidden><IconZoom width={18} height={18} /></span>

            {images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-ink/60 p-2.5 opacity-0 backdrop-blur transition group-hover:opacity-100 sm:block" aria-label="Photo précédente"><IconChevronLeft /></button>
                <button onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-ink/60 p-2.5 opacity-0 backdrop-blur transition group-hover:opacity-100 sm:block" aria-label="Photo suivante"><IconChevronRight /></button>
              </>
            )}
          </div>

          {/* Boutons DEVANT / DOS */}
          {frontIndex !== -1 && backIndex !== -1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 rounded-full border border-white/10 bg-ink/75 p-1 shadow-xl backdrop-blur-xl" role="group" aria-label="Vue du maillot">
              {[{ i: frontIndex, l: "Devant" }, { i: backIndex, l: "Dos" }].map(({ i, l }) => (
                <button key={l} onClick={() => onChange(i)} aria-pressed={active === i} className={`min-w-[96px] rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] transition ${active === i ? "bg-bone text-ink" : "text-bone-muted hover:text-bone"}`}>
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Points de pagination (mobile) */}
      {images.length > 1 && (
        <div className="mt-4 flex justify-center gap-1.5 lg:hidden">
          {images.map((_, i) => (
            <button key={i} onClick={() => onChange(i)} aria-label={`Photo ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-bone" : "w-1.5 bg-bone/30"}`} />
          ))}
        </div>
      )}

      {lightbox && <Lightbox images={images} active={active} onChange={onChange} onClose={() => setLightbox(false)} preview={preview} />}
    </div>
  );
}

function Lightbox({ images, active, onChange, onClose, preview }: { images: GalleryImage[]; active: number; onChange: (i: number) => void; onClose: () => void; preview: FlockingPreview }) {
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const img = images[active];
  const go = (d: 1 | -1) => { setZoom(null); onChange((active + d + images.length) % images.length); };
  const pos = (clientX: number, clientY: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { x: Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100)) };
  };
  return (
    <div className="fixed inset-0 z-[80] flex animate-fade-in flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Zoom sur le maillot">
      <div className="flex items-center justify-between p-4 text-sm text-bone-muted">
        <span>{active + 1} / {images.length} · {zoom ? "Glisse pour explorer" : "Touche l'image pour zoomer"}</span>
        <button onClick={onClose} className="rounded-full bg-white/10 p-2.5 text-bone" aria-label="Fermer le zoom"><IconClose /></button>
      </div>
      <div className="relative flex flex-1 items-center overflow-hidden">
        <div
          className={`relative mx-auto aspect-[4/5] w-[min(100%,calc((100dvh-90px)*0.8))] overflow-hidden ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          onClick={(e) => setZoom(zoom ? null : pos(e.clientX, e.clientY, e.currentTarget))}
          onMouseMove={(e) => zoom && setZoom(pos(e.clientX, e.clientY, e.currentTarget))}
          onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
          onTouchMove={(e) => zoom && setZoom(pos(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget))}
          onTouchEnd={(e) => {
            if (!touch.current || zoom) return;
            const dx = e.changedTouches[0].clientX - touch.current.x;
            if (Math.abs(dx) > 50) { e.preventDefault(); go(dx < 0 ? 1 : -1); }
            touch.current = null;
          }}
        >
          <div className="absolute inset-0 transition-transform duration-200" style={zoom ? { transform: "scale(2.6)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}>
            <Image src={img.url} alt={img.alt} fill sizes="100vw" className="object-cover" unoptimized={img.url.endsWith(".svg")} quality={95} />
            {preview && img.kind === "BACK" && <Flocking preview={preview} large />}
          </div>
        </div>
        {images.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3" aria-label="Photo précédente"><IconChevronLeft /></button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3" aria-label="Photo suivante"><IconChevronRight /></button>
          </>
        )}
      </div>
    </div>
  );
}
