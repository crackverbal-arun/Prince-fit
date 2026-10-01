import type { PackageStatus } from "@/lib/queries";
import { fmtDate, rupees } from "@/lib/dates";
import { Bar, Chip } from "./ui";

export function PackageCard({ s, children }: { s: PackageStatus; children?: React.ReactNode }) {
  const low = !s.expired && (s.left <= 2 || s.daysLeft <= 5);
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{s.pkg.name}</div>
          <div className="text-xs text-muted">{fmtDate(s.pkg.startDate)} – {fmtDate(s.pkg.endDate)}</div>
        </div>
        {s.expired ? <Chip tone="bad">Ended</Chip> : low ? <Chip tone="warn">Renew soon</Chip> : <Chip tone="good">Active</Chip>}
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div><span className="text-3xl font-bold">{s.left}</span><span className="text-sm text-muted"> of {s.pkg.totalSessions} sessions left</span></div>
        {!s.expired && <div className="text-xs text-muted">{s.daysLeft}d to go</div>}
      </div>
      <div className="mt-2"><Bar value={s.used} max={s.pkg.totalSessions} tone={low ? "warn" : "ink"} /></div>
      <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm">
        <span className="text-muted">Paid {rupees(s.pkg.paid)} of {rupees(s.pkg.amount)}</span>
        {s.due > 0 ? <span className="font-semibold text-bad">{rupees(s.due)} due</span> : <span className="font-semibold text-good">Fully paid</span>}
      </div>
      {children}
    </div>
  );
}
