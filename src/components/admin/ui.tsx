export function PageTitle({ title, children, subtitle }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl uppercase tracking-wide">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-bone-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-bone-dim">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-bone-muted">{hint}</p>}
    </div>
  );
}

export function Field({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-bone-dim">{hint}</span>}
    </label>
  );
}

export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-bone-muted">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#D6B36A]" /> {label}
    </label>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="border-b border-ink-600 text-xs uppercase tracking-[0.12em] text-bone-dim">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-ink-600">{children}</tbody>
      </table>
    </div>
  );
}

export function Alert({ tone = "warn", children }: { tone?: "warn" | "info" | "ok"; children: React.ReactNode }) {
  const cls = tone === "warn" ? "border-gold/30 bg-gold/10 text-gold-light" : tone === "ok" ? "border-pitch/30 bg-pitch/10 text-pitch" : "border-ink-500 bg-ink-800 text-bone-muted";
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}
