"use client";
import { useMemo, useState, useTransition } from "react";
import { logCustomFood, logFood } from "@/app/actions/nutrition";
import { MEALS } from "@/lib/nutrition";
import { IconPlus } from "./icons";

export type FoodOption = { id: string; name: string; servingLabel: string; servingG: number; kcal: number; protein: number };

function defaultMeal() {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date()));
  return h < 11 ? "Breakfast" : h < 16 ? "Lunch" : h < 19 ? "Snacks" : "Dinner";
}

export function FoodAdder({ clientId, date, foods }: { clientId: string; date: string; foods: FoodOption[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"search" | "custom">("search");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<FoodOption | null>(null);
  const [servings, setServings] = useState(1);
  const [unit, setUnit] = useState<"serving" | "g">("serving");
  const [grams, setGrams] = useState(100);
  const [mealSlot, setMeal] = useState(defaultMeal);
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (t ? foods.filter((f) => f.name.toLowerCase().includes(t)) : foods).slice(0, 8);
  }, [q, foods]);

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="btn-primary w-full"><IconPlus className="size-4" />Add food</button>;

  const g = unit === "g" ? grams : servings * (picked?.servingG ?? 0);
  const kcal = picked ? Math.round((picked.kcal / picked.servingG) * g) : 0;
  const protein = picked ? +((picked.protein / picked.servingG) * g).toFixed(1) : 0;

  const submit = (fd: FormData) => start(async () => {
    fd.set("date", date); fd.set("meal", mealSlot);
    const r = mode === "custom" ? await logCustomFood(clientId, fd) : await logFood(clientId, fd);
    setMsg(r);
    if (r.ok) { setPicked(null); setQ(""); setServings(1); }
  });

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Add food</span>
        <button type="button" onClick={() => { setOpen(false); setMsg(null); }} className="text-xs text-muted underline">Close</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {MEALS.map((m) => <button key={m} type="button" onClick={() => setMeal(m)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${mealSlot === m ? "bg-ink text-volt ring-ink" : "bg-bg text-muted ring-line"}`}>{m}</button>)}
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-bg p-1 ring-1 ring-line">
        {(["search", "custom"] as const).map((m) => <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-lg py-2 text-xs font-semibold ${mode === m ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted"}`}>{m === "search" ? "From food list" : "Enter manually"}</button>)}
      </div>

      {mode === "search" ? (
        <form action={submit} className="space-y-2">
          {!picked ? (
            <>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: roti, dal, paneer, egg…" className="input" autoFocus />
              <div className="divide-y divide-line overflow-hidden rounded-xl ring-1 ring-line">
                {matches.map((f) => (
                  <button key={f.id} type="button" onClick={() => setPicked(f)} className="flex w-full items-center justify-between bg-surface px-3 py-2.5 text-left text-sm">
                    <span className="truncate">{f.name}</span>
                    <span className="shrink-0 text-xs text-muted">{f.servingLabel} · {f.kcal} kcal</span>
                  </button>
                ))}
                {!matches.length && <div className="bg-surface px-3 py-3 text-sm text-muted">Not found. Use &ldquo;Enter manually&rdquo;.</div>}
              </div>
            </>
          ) : (
            <>
              <input type="hidden" name="foodId" value={picked.id} />
              <div className="flex items-center justify-between rounded-xl bg-bg px-3 py-2 ring-1 ring-line">
                <span className="text-sm font-semibold">{picked.name}</span>
                <button type="button" onClick={() => setPicked(null)} className="text-xs text-muted underline">Change</button>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-bg p-1 ring-1 ring-line">
                <button type="button" onClick={() => setUnit("serving")} className={`rounded-lg py-1.5 text-xs font-semibold ${unit === "serving" ? "bg-surface shadow-sm ring-1 ring-line" : "text-muted"}`}>{picked.servingLabel} ({picked.servingG}g)</button>
                <button type="button" onClick={() => setUnit("g")} className={`rounded-lg py-1.5 text-xs font-semibold ${unit === "g" ? "bg-surface shadow-sm ring-1 ring-line" : "text-muted"}`}>Grams</button>
              </div>
              {unit === "serving" ? (
                <div className="flex items-center gap-2">
                  {[0.5, 1, 1.5, 2, 3].map((n) => <button key={n} type="button" onClick={() => setServings(n)} className={`flex-1 rounded-lg py-2 text-sm font-semibold ring-1 ${servings === n ? "bg-ink text-volt ring-ink" : "bg-bg ring-line"}`}>{n}</button>)}
                  <input name="servings" aria-label="Servings" type="number" step="0.5" min="0.5" value={servings} onChange={(e) => setServings(Number(e.target.value))} className="input w-20 text-center" />
                </div>
              ) : <input name="grams" aria-label="Grams" type="number" inputMode="numeric" value={grams} onChange={(e) => setGrams(Number(e.target.value))} className="input" />}
              <div className="text-sm text-muted">≈ <b className="text-ink">{kcal} kcal</b> · {protein} g protein</div>
              <button disabled={pending} className="btn-primary w-full">{pending ? "Adding…" : `Add to ${mealSlot}`}</button>
            </>
          )}
        </form>
      ) : (
        <form action={submit} className="space-y-2">
          <input name="name" required placeholder="What did you eat? e.g. Restaurant thali" className="input" />
          <div className="grid grid-cols-4 gap-2">
            {([["kcal", "kcal"], ["protein", "Protein g"], ["carbs", "Carbs g"], ["fat", "Fat g"]] as const).map(([k, l]) => (
              <label key={k}><span className="label">{l}</span><input name={k} type="number" inputMode="decimal" step="0.1" required={k === "kcal"} className="input px-2 text-center" /></label>
            ))}
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-xs font-semibold text-muted">More nutrients (from the packet label)</summary>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([["fiber", "Fibre g"], ["sodium", "Sodium mg"], ["calcium", "Calcium mg"], ["iron", "Iron mg"], ["potassium", "Potass. mg"], ["vitC", "Vit C mg"]] as const).map(([k, l]) => (
                <label key={k}><span className="label">{l}</span><input name={k} type="number" inputMode="decimal" step="0.1" className="input px-2 text-center" /></label>
              ))}
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs text-muted"><input type="checkbox" name="save" /> Save to food list, 1 serving =<input name="servingG" type="number" placeholder="g" className="input h-8 w-16 px-1 text-center text-xs" /> g</label>
          </details>
          <button disabled={pending} className="btn-primary w-full">{pending ? "Adding…" : `Add to ${mealSlot}`}</button>
        </form>
      )}
      {msg && <p className={`text-sm ${msg.error ? "text-bad" : "text-good"}`}>{msg.error ?? `✓ ${msg.ok}`}</p>}
    </div>
  );
}
