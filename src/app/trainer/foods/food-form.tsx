"use client";
import { useActionState, useState } from "react";
import { deleteFood, saveFood } from "@/app/actions/nutrition";
import { NUTRIENTS } from "@/lib/nutrition";
import { Submit } from "@/components/submit";
import { ConfirmButton } from "@/components/confirm-button";

type F = { id: string; name: string; servingLabel: string; servingG: number; per100: Partial<Record<string, number>> };

export function FoodForm({ food, onClose }: { food?: F; onClose?: () => void }) {
  const [state, action] = useActionState(saveFood.bind(null, food?.id ?? null), undefined);
  return (
    <form action={action} className="space-y-2">
      <input name="name" defaultValue={food?.name} required placeholder="Food name" className="input" />
      <div className="grid grid-cols-2 gap-2">
        <input name="servingLabel" defaultValue={food?.servingLabel} placeholder="Serving: 1 katori" className="input" aria-label="Serving label" />
        <input name="servingG" type="number" step="any" defaultValue={food?.servingG} required placeholder="Serving grams" className="input" aria-label="Serving grams" />
      </div>
      <input type="hidden" name="basis" value="100g" />
      <p className="text-[11px] text-muted">Nutrients per 100 g (as on most labels). Leave unknown ones blank.</p>
      <div className="grid grid-cols-3 gap-2">
        {NUTRIENTS.map((n) => (
          <label key={n.key}><span className="label">{n.label} ({n.unit})</span>
            <input name={n.key} type="number" step="any" defaultValue={food?.per100[n.key] ?? ""} required={n.key === "kcal"} className="input px-2 text-center" /></label>
        ))}
      </div>
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      {state?.ok && <p className="text-sm text-good">✓ {state.ok}</p>}
      <div className="flex gap-2">
        {food && <ConfirmButton action={() => deleteFood(food.id)} message={`Delete ${food.name} from the food list? Past logs are kept.`} className="btn-ghost text-bad">Delete</ConfirmButton>}
        {onClose && <button type="button" onClick={onClose} className="btn-ghost flex-1">Close</button>}
        <div className="flex-[2]"><Submit>{food ? "Save" : "Add food"}</Submit></div>
      </div>
    </form>
  );
}

export function FoodRow({ food }: { food: F }) {
  const [open, setOpen] = useState(false);
  const per = (k: string) => Math.round(((food.per100[k] ?? 0) * food.servingG) / 100);
  return (
    <div className="px-4 py-2.5">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-2 text-left">
        <span className="min-w-0"><span className="block truncate text-sm">{food.name}</span><span className="text-[11px] text-muted">{food.servingLabel} ({food.servingG} g)</span></span>
        <span className="shrink-0 text-right text-xs text-muted"><b className="text-ink">{per("kcal")} kcal</b><br />P {per("protein")} · C {per("carbs")} · F {per("fat")}</span>
      </button>
      {open && <div className="mt-3"><FoodForm food={food} onClose={() => setOpen(false)} /></div>}
    </div>
  );
}
