"use client";
import { useState } from "react";
import { bmiReport, bmiTone } from "@/lib/bmi";
import type { Sex } from "@/lib/nutrition";

const TONE = { good: "bg-green-50 text-good ring-green-200", warn: "bg-amber-50 text-warn ring-amber-200", bad: "bg-red-50 text-bad ring-red-200" } as const;
const SCALE = [[16, 18.5, "Under"], [18.5, 23, "Normal"], [23, 25, "Over"], [25, 35, "Obese"]] as const;

export function BmiCalculator({ initial }: { initial?: { sex?: Sex | null; age?: number | null; heightCm?: number | null; weightKg?: number | null } }) {
  const [sex, setSex] = useState<Sex>(initial?.sex ?? "male");
  const [age, setAge] = useState(String(initial?.age ?? ""));
  const [unit, setUnit] = useState<"cm" | "ft">("ft");
  const [cm, setCm] = useState(String(initial?.heightCm ?? ""));
  const totalIn = initial?.heightCm ? Math.round(initial.heightCm / 2.54) : 0;
  const [ft, setFt] = useState(totalIn ? String(Math.floor(totalIn / 12)) : "");
  const [inch, setInch] = useState(totalIn ? String(totalIn % 12) : "");
  const [kg, setKg] = useState(String(initial?.weightKg ?? ""));

  const heightCm = unit === "cm" ? Number(cm) : (Number(ft) * 12 + Number(inch || 0)) * 2.54;
  const valid = Number(age) >= 2 && heightCm >= 90 && heightCm <= 250 && Number(kg) >= 15 && Number(kg) <= 300;
  const r = valid ? bmiReport({ sex, age: Number(age), heightCm, weightKg: Number(kg) }) : null;
  const pos = r ? Math.min(100, Math.max(0, ((r.bmi - 16) / (35 - 16)) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div className="card space-y-3">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-bg p-1 ring-1 ring-line">
          {(["male", "female"] as const).map((s) => <button key={s} type="button" onClick={() => setSex(s)} className={`rounded-lg py-2.5 text-sm font-semibold capitalize ${sex === s ? "bg-ink text-volt" : "text-muted"}`}>{s}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label><span className="label">Age</span><input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" type="number" className="input" placeholder="years" /></label>
          <label><span className="label">Weight (kg)</span><input value={kg} onChange={(e) => setKg(e.target.value)} inputMode="decimal" type="number" step="0.1" className="input" /></label>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between"><span className="label !mb-0">Height</span>
            <div className="flex gap-1 text-xs">{(["ft", "cm"] as const).map((u) => <button key={u} type="button" onClick={() => setUnit(u)} className={`rounded-md px-2 py-0.5 font-semibold ${unit === u ? "bg-ink text-white" : "text-muted"}`}>{u === "ft" ? "ft / in" : "cm"}</button>)}</div>
          </div>
          {unit === "cm" ? <input value={cm} onChange={(e) => setCm(e.target.value)} inputMode="decimal" type="number" className="input" aria-label="Height in cm" />
            : <div className="grid grid-cols-2 gap-2"><input value={ft} onChange={(e) => setFt(e.target.value)} inputMode="numeric" type="number" placeholder="ft" className="input" aria-label="Feet" /><input value={inch} onChange={(e) => setInch(e.target.value)} inputMode="numeric" type="number" placeholder="in" className="input" aria-label="Inches" /></div>}
        </div>
      </div>

      {r ? (
        <div className="card space-y-4">
          <div className="flex items-end justify-between">
            <div><div className="text-xs text-muted">Your BMI</div><div className="text-5xl font-bold tracking-tight">{r.bmi}</div></div>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${TONE[bmiTone(r.asian)]}`}>{r.asian}</span>
          </div>
          <div>
            <div className="relative flex h-3 overflow-hidden rounded-full">
              {SCALE.map(([a, b, l]) => <div key={l} style={{ width: `${((b - a) / 19) * 100}%` }} className={l === "Normal" ? "bg-green-400" : l === "Obese" ? "bg-red-400" : "bg-amber-300"} />)}
            </div>
            <div className="relative h-4"><div className="absolute -top-1 size-0 -translate-x-1/2 border-x-[6px] border-b-[8px] border-x-transparent border-b-ink" style={{ left: `${pos}%` }} /></div>
            <div className="flex justify-between text-[10px] text-muted"><span>16</span><span>18.5</span><span>23</span><span>25</span><span>35</span></div>
          </div>
          {!r.adult && <p className="rounded-xl bg-amber-50 p-3 text-sm text-warn ring-1 ring-amber-200">Under 18: BMI must be read against age-and-sex growth charts (BMI-for-age percentiles), so these adult categories don&apos;t apply.</p>}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-muted">Asian-Indian category</dt><dd className="font-semibold">{r.asian}</dd></div>
            <div><dt className="text-xs text-muted">WHO category</dt><dd className="font-semibold">{r.who}</dd></div>
            <div><dt className="text-xs text-muted">Healthy weight for this height</dt><dd className="font-semibold">{r.healthyRange.asian[0]}–{r.healthyRange.asian[1]} kg</dd></div>
            {r.bodyFat !== null && <div><dt className="text-xs text-muted">Estimated body fat</dt><dd className="font-semibold">~{r.bodyFat}%</dd></div>}
            <div><dt className="text-xs text-muted">BMR (calories at rest)</dt><dd className="font-semibold">{r.bmr.toLocaleString("en-IN")} kcal/day</dd></div>
          </dl>
          <p className="text-[11px] leading-relaxed text-muted">
            BMI = weight ÷ height². Sex and age don&apos;t change BMI itself; they&apos;re used for the body-fat estimate (Deurenberg formula) and BMR (Mifflin-St Jeor).
            Indian guidelines use lower cut-offs (overweight from 23, obese from 25) because health risk rises at a lower BMI. BMI can&apos;t tell muscle from fat, so muscular clients may read high.
          </p>
        </div>
      ) : <p className="px-1 text-sm text-muted">Enter age, height and weight to see the result.</p>}
    </div>
  );
}
