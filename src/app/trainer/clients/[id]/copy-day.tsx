"use client";
import { DAYS } from "@/lib/dates";

export function CopyDay({ from, action }: { from: number; action: (to: number) => Promise<void> }) {
  return (
    <select
      aria-label={`Copy ${DAYS[from]} to another day`}
      defaultValue=""
      onChange={(e) => {
        const to = Number(e.target.value);
        e.target.value = "";
        if (confirm(`Replace ${DAYS[to]}'s plan with ${DAYS[from]}'s?`)) action(to);
      }}
      className="rounded-lg bg-bg px-2 py-1 text-xs text-muted ring-1 ring-line"
    >
      <option value="" disabled>Copy to…</option>
      {[1, 2, 3, 4, 5, 6, 0].filter((d) => d !== from).map((d) => <option key={d} value={d}>{DAYS[d]}</option>)}
    </select>
  );
}
