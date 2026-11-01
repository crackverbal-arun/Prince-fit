"use client";
import { useState, useTransition } from "react";
import { removeMeal, updateMeal } from "@/app/actions/trainer";
import { IconTrash } from "@/components/icons";

export function MealItemRow({ clientId, item }: { clientId: string; item: { id: string; slot: string; description: string } }) {
  const [edit, setEdit] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2">
        <button type="button" onClick={() => setEdit(!edit)} className="flex-1 text-left">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{item.slot}</div>
          <div className="text-sm">{item.description}</div>
        </button>
        <button type="button" onClick={() => setEdit(!edit)} className="text-xs font-semibold text-muted underline">Edit</button>
        <button type="button" disabled={pending} aria-label={`Remove ${item.slot}`} onClick={() => confirm(`Remove ${item.slot}?`) && start(() => removeMeal(clientId, item.id))} className="grid size-8 place-items-center rounded-lg text-muted hover:text-bad"><IconTrash className="size-4" /></button>
      </div>
      {edit && (
        <form action={(fd) => start(async () => { await updateMeal(clientId, item.id, fd); setEdit(false); })} className="mt-2 space-y-2">
          <input name="slot" defaultValue={item.slot} className="input" aria-label="When" />
          <textarea name="description" defaultValue={item.description} rows={2} className="input h-auto py-2" aria-label="What" />
          <div className="flex gap-2"><button type="button" onClick={() => setEdit(false)} className="btn-ghost flex-1">Cancel</button><button disabled={pending} className="btn-primary flex-[2]">Save</button></div>
        </form>
      )}
    </div>
  );
}
