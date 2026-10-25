"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="h-display text-5xl">Un souci technique</h1>
      <p className="max-w-md text-bone-muted">Une erreur est survenue. Réessaie dans un instant.</p>
      <button onClick={reset} className="btn-primary">Réessayer</button>
    </div>
  );
}
