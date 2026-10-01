import type { ReactNode } from "react";

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "volt" }) {
  const tones = {
    neutral: "bg-bg text-muted ring-line",
    good: "bg-green-50 text-good ring-green-200",
    warn: "bg-amber-50 text-warn ring-amber-200",
    bad: "bg-red-50 text-bad ring-red-200",
    volt: "bg-volt text-volt-ink ring-lime-300",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tones[tone]}`}>{children}</span>;
}

export function Bar({ value, max, tone = "ink" }: { value: number; max: number; tone?: "ink" | "volt" | "warn" }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  const color = { ink: "bg-ink", volt: "bg-volt", warn: "bg-warn" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-bg ring-1 ring-line">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card p-3">
      <div className="text-[11px] font-medium text-muted">{label}</div>
      <div className="mt-0.5 text-2xl font-bold tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">{children}</div>;
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="grid shrink-0 place-items-center rounded-full bg-ink font-semibold text-volt" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

export function flagTone(kind: string) {
  return kind === "missed" || kind === "dues" ? "bad" : "warn";
}
