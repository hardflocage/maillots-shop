/** Pastilles des moyens de paiement réellement activés (liste fournie par activePaymentMethods). */
export function PaymentBadges({ methods, className = "" }: { methods: string[]; className?: string }) {
  if (methods.length === 0) return null;
  return (
    <ul className={`flex flex-wrap items-center gap-1.5 ${className}`} aria-label="Moyens de paiement acceptés">
      {methods.map((m) => (
        <li key={m} className="rounded-md border border-ink-500 bg-ink-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-bone-muted">{m}</li>
      ))}
    </ul>
  );
}
