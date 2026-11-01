"use client";
import { useTransition } from "react";
import { addWater, deleteWater } from "@/app/actions/nutrition";

export function WaterWidget({ clientId, date, entries, targetMl, compact = false }: { clientId: string; date: string; entries: { id: string; ml: number }[]; targetMl: number; compact?: boolean }) {
  const [pending, start] = useTransition();
  const total = entries.reduce((s, e) => s + e.ml, 0);
  const pct = Math.min(100, (total / targetMl) * 100);
  const glasses = Math.round(total / 250);
  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">💧 Water</span>
        <span className="text-sm"><b>{(total / 1000).toFixed(2)} L</b><span className="text-muted"> / {(targetMl / 1000).toFixed(1)} L</span></span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-sky-50 ring-1 ring-sky-100" role="progressbar" aria-valuenow={total} aria-valuemax={targetMl} aria-label="Water today">
        <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-muted">{glasses} glass{glasses === 1 ? "" : "es"} · {total >= targetMl ? "Target reached 🎉" : `${((targetMl - total) / 1000).toFixed(2)} L to go`}</div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[250, 500, 750, 1000].map((ml) => (
          <button key={ml} type="button" disabled={pending} onClick={() => start(() => addWater(clientId, date, ml))} className="rounded-xl bg-sky-50 py-2 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 active:scale-95 disabled:opacity-50">
            +{ml >= 1000 ? "1 L" : `${ml} ml`}
          </button>
        ))}
      </div>
      {!compact && entries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entries.map((e) => (
            <button key={e.id} type="button" disabled={pending} onClick={() => start(() => deleteWater(clientId, e.id))} aria-label={`Remove ${e.ml} ml`}
              className="rounded-full bg-bg px-2 py-0.5 text-[11px] text-muted ring-1 ring-line">{e.ml} ml ✕</button>
          ))}
        </div>
      )}
    </div>
  );
}
