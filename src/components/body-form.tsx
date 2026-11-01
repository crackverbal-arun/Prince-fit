"use client";
import { useActionState, useState } from "react";
import { saveBodyStat } from "@/app/actions/body";
import { MEASURES } from "@/lib/body";
import { Submit } from "./submit";
import { IconPlus } from "./icons";

type Values = Partial<Record<string, number | string | null>>;

/** Add or edit one set of body measurements. Used by clients and by Prince. */
export function BodyForm({ clientId, statId, values, today, openByDefault = false, onDone }: { clientId: string; statId?: string; values?: Values; today: string; openByDefault?: boolean; onDone?: () => void }) {
  const [open, setOpen] = useState(openByDefault || !!statId);
  const [state, action] = useActionState(async (prev: unknown, fd: FormData) => {
    const r = await saveBodyStat(clientId, statId ?? null, prev, fd);
    if (r.ok) { setOpen(openByDefault || !!statId); onDone?.(); }
    return r;
  }, undefined);

  if (!open) return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary w-full"><IconPlus className="size-4" />Log measurements</button>
      {state?.ok && <p className="mt-2 text-center text-sm font-medium text-good">{state.ok}</p>}
    </>
  );
  return (
    <form action={action} className={statId ? "space-y-3" : "card space-y-3"}>
      <label className="block"><span className="label">Date</span><input name="date" type="date" max={today} defaultValue={String(values?.date ?? today)} className="input" /></label>
      <div className="grid grid-cols-3 gap-2">
        {MEASURES.map(([k, l, unit]) => (
          <label key={k}><span className="label">{l} ({unit})</span>
            <input name={k} type="number" inputMode="decimal" step="0.1" defaultValue={values?.[k] == null ? "" : String(values[k])} className="input px-2 text-center" /></label>
        ))}
      </div>
      <input name="notes" defaultValue={String(values?.notes ?? "")} placeholder="Notes (optional): measured after workout, etc." className="input" />
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      <div className="flex gap-2">
        {!statId && <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancel</button>}
        <div className="flex-[2]"><Submit>{statId ? "Save changes" : "Save"}</Submit></div>
      </div>
    </form>
  );
}
