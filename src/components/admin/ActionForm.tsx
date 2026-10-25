"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/app/actions/public";

/** Formulaire d'administration avec retour visuel (succès / erreur) */
export function ActionForm({ action, children, className, submitLabel = "Enregistrer", resetOnSuccess, encType }: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
  resetOnSuccess?: boolean;
  encType?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className} encType={encType}>
      {children}
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button className="btn-primary" disabled={pending}>{pending ? "Enregistrement…" : submitLabel}</button>
        {state?.error && <p className="text-sm text-signal" role="alert">{state.error}</p>}
        {state?.ok && <p className="text-sm text-pitch" role="status">{state.message}</p>}
      </div>
    </form>
  );
}

export function ConfirmButton({ children, message, className }: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
