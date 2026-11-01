"use client";
import { useState, useTransition } from "react";
import { deleteFoodLog, updateFoodLog } from "@/app/actions/nutrition";
import { MEALS } from "@/lib/nutrition";
import { IconTrash } from "./icons";

export function FoodLogRow({ clientId, log }: { clientId: string; log: { id: string; name: string; grams: number | null; servings: number | null; meal: string; kcal: number; protein: number; byTrainer: boolean } }) {
  const [edit, setEdit] = useState(false);
  const [pending, start] = useTransition();
  const amount = log.servings ? `${+log.servings.toFixed(2)} serving${log.servings === 1 ? "" : "s"}${log.grams ? ` · ${log.grams} g` : ""}` : log.grams ? `${log.grams} g` : "";
  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setEdit(!edit)} className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm">{log.name}</div>
          <div className="text-[11px] text-muted">{amount}{log.byTrainer ? " · added by Prince" : ""}</div>
        </button>
        <div className="text-right text-sm"><b>{Math.round(log.kcal)}</b><span className="text-xs text-muted"> kcal</span><div className="text-[11px] text-muted">{+log.protein.toFixed(1)} g protein</div></div>
      </div>
      {edit && (
        <form action={(fd) => start(async () => { await updateFoodLog(clientId, log.id, fd); setEdit(false); })} className="mt-2 flex flex-wrap items-center gap-2">
          {log.grams && <label className="flex items-center gap-1 text-xs text-muted"><input name="grams" type="number" defaultValue={log.grams} className="input h-9 w-20 px-2 text-center" aria-label="Grams" />g</label>}
          <select name="meal" defaultValue={log.meal} className="input h-9 w-auto px-2 text-sm" aria-label="Meal">{MEALS.map((m) => <option key={m}>{m}</option>)}</select>
          <button disabled={pending} className="btn-primary btn-sm">Save</button>
          <button type="button" disabled={pending} onClick={() => confirm(`Remove ${log.name}?`) && start(() => deleteFoodLog(clientId, log.id))} aria-label={`Delete ${log.name}`} className="btn-ghost btn-sm text-bad"><IconTrash className="size-4" /></button>
        </form>
      )}
    </div>
  );
}
