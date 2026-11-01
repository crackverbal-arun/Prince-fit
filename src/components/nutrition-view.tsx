import Link from "next/link";
import { getDailyNutrition, getFoodLogs, getFoods, getTargets, getWater } from "@/lib/q-client";
import { addDays, fmtDate, todayISO } from "@/lib/dates";
import { MACROS, MEALS, MICROS, fmtAmount, intakeTone, sum, type NutrientKey, type Nutrients } from "@/lib/nutrition";
import { BarChart } from "./bar-chart";
import { FoodAdder } from "./food-adder";
import { FoodLogRow } from "./food-log-row";
import { WaterWidget } from "./water-widget";
import { Empty } from "./ui";
import { IconBack, IconChevron } from "./icons";

const TONE = { good: ["bg-good", "text-good", "On track"], warn: ["bg-warn", "text-warn", "Low"], bad: ["bg-bad", "text-bad", "Very low"], neutral: ["bg-muted", "text-muted", ""] } as const;
function label(key: NutrientKey, tone: keyof typeof TONE) {
  if (key === "sodium") return tone === "good" ? "Under limit" : "Over limit";
  if ((key === "kcal" || key === "carbs" || key === "fat") && tone === "bad") return "Over";
  return TONE[tone][2];
}

function Meter({ k, labelText, unit, eaten, target, big = false }: { k: NutrientKey; labelText: string; unit: string; eaten: number; target: number; big?: boolean }) {
  const tone = intakeTone(k, eaten, target);
  const pct = target ? Math.min(100, (eaten / target) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className={big ? "font-semibold" : ""}>{labelText}</span>
        <span className="text-right"><b>{fmtAmount(eaten, unit)}</b><span className="text-xs text-muted"> / {fmtAmount(target, unit)}{k === "sodium" ? " max" : ""}</span></span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className={`h-2 flex-1 overflow-hidden rounded-full bg-bg ring-1 ring-line`}><div className={`h-full rounded-full ${TONE[tone][0]}`} style={{ width: `${pct}%` }} /></div>
        <span className={`w-20 text-right text-[11px] font-semibold ${TONE[tone][1]}`}>{target ? `${Math.round((eaten / target) * 100)}%` : ""} {label(k, tone)}</span>
      </div>
    </div>
  );
}

/**
 * Nutrition for one client: day view (food by meal, macros, micros, water) or week/month history.
 * Used on the client's Food tab and on Prince's client profile.
 */
export async function NutritionView({ clientId, date, range, href, canEditTargets = false }: {
  clientId: string; date: string; range: "day" | "week" | "month";
  href: (p: { date?: string; range?: string }) => string; canEditTargets?: boolean;
}) {
  const today = todayISO();
  const { targets, source, profile } = await getTargets(clientId);
  const tabs = (["day", "week", "month"] as const).map((r) => (
    <Link key={r} href={href({ date, range: r })} replace scroll={false} className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold ${range === r ? "bg-surface shadow-sm ring-1 ring-line" : "text-muted"}`}>{r === "day" ? "Day" : r === "week" ? "Week" : "Month"}</Link>
  ));
  const header = <div className="flex gap-1 rounded-xl bg-bg p-1 ring-1 ring-line">{tabs}</div>;

  if (range !== "day") {
    const n = range === "week" ? 7 : 30, from = addDays(date, -(n - 1));
    const days = await getDailyNutrition(clientId, from, date);
    const logged = days.filter((d) => d.entries > 0);
    const avg = (k: NutrientKey) => (logged.length ? logged.reduce((s, d) => s + (d.totals[k] ?? 0), 0) / logged.length : 0);
    const avgWater = days.reduce((s, d) => s + d.waterMl, 0) / n;
    const bars = (k: NutrientKey | "water") => days.map((d) => ({ label: range === "week" ? fmtDate(d.date).split(" ")[0] : fmtDate(d.date), title: fmtDate(d.date), value: k === "water" ? d.waterMl : d.totals[k] ?? 0, highlight: d.date === date }));
    return (
      <div className="space-y-3">
        {header}
        <p className="px-1 text-xs text-muted">{fmtDate(from)} – {fmtDate(date)} · food logged on {logged.length} of {n} days. Averages use logged days only.</p>
        {!logged.length && !days.some((d) => d.waterMl) ? <Empty>Nothing logged in this period.</Empty> : (
          <>
            <div className="card"><div className="mb-1 text-sm font-semibold">Calories per day</div><BarChart data={bars("kcal")} target={targets.kcal} format={(v) => `${Math.round(v)} kcal`} /></div>
            <div className="card"><div className="mb-1 text-sm font-semibold">Protein per day</div><BarChart data={bars("protein")} target={targets.protein} format={(v) => `${Math.round(v)} g`} /></div>
            <div className="card"><div className="mb-1 text-sm font-semibold">Water per day</div><BarChart data={bars("water")} target={targets.waterMl} format={(v) => `${(v / 1000).toFixed(2)} L`} /></div>
            <div className="card space-y-3">
              <div className="text-sm font-semibold">Daily average vs target</div>
              {MACROS.map((m) => <Meter key={m.key} k={m.key} labelText={m.label} unit={m.unit} eaten={avg(m.key)} target={targets[m.key]} />)}
              <div className="flex justify-between text-sm"><span>Water</span><span><b>{(avgWater / 1000).toFixed(2)} L</b><span className="text-xs text-muted"> / {(targets.waterMl / 1000).toFixed(1)} L</span></span></div>
            </div>
            <details className="card">
              <summary className="cursor-pointer text-sm font-semibold">Vitamins &amp; minerals (average)</summary>
              <div className="mt-3 space-y-3">{MICROS.map((m) => <Meter key={m.key} k={m.key} labelText={m.label} unit={m.unit} eaten={avg(m.key)} target={targets[m.key]} />)}</div>
            </details>
          </>
        )}
      </div>
    );
  }

  const [logs, water, foods] = await Promise.all([getFoodLogs(clientId, date), getWater(clientId, date), getFoods()]);
  const totals: Nutrients = sum(logs.map((l) => l.nutrients));
  const t = (k: NutrientKey) => totals[k] ?? 0;
  const left = Math.round(targets.kcal - t("kcal"));

  return (
    <div className="space-y-3">
      {header}
      <div className="flex items-center justify-between">
        <Link href={href({ date: addDays(date, -1), range })} replace scroll={false} className="btn-ghost btn-sm" aria-label="Previous day"><IconBack className="size-4" /></Link>
        <span className="font-semibold">{date === today ? "Today" : fmtDate(date)}</span>
        {date < today ? <Link href={href({ date: addDays(date, 1), range })} replace scroll={false} className="btn-ghost btn-sm" aria-label="Next day"><IconChevron className="size-4" /></Link> : <span className="w-9" />}
      </div>

      <div className="card">
        <div className="flex items-end justify-between">
          <div><div className="text-xs text-muted">Calories</div><div className="text-3xl font-bold tracking-tight">{Math.round(t("kcal")).toLocaleString("en-IN")}<span className="text-base font-medium text-muted"> / {targets.kcal.toLocaleString("en-IN")}</span></div></div>
          <div className={`text-right text-sm font-semibold ${left >= 0 ? "text-muted" : "text-bad"}`}>{left >= 0 ? `${left} left` : `${-left} over`}</div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {(["protein", "carbs", "fat"] as const).map((k) => {
            const pct = Math.min(100, (t(k) / targets[k]) * 100);
            return (
              <div key={k}>
                <div className="text-[11px] font-medium capitalize text-muted">{k}</div>
                <div className="text-sm font-bold">{Math.round(t(k))}<span className="font-normal text-muted">/{targets[k]} g</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg ring-1 ring-line"><div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      <WaterWidget clientId={clientId} date={date} entries={water.map((w) => ({ id: w.id, ml: w.ml }))} targetMl={targets.waterMl} />

      <FoodAdder clientId={clientId} date={date} foods={foods.map((f) => ({ id: f.id, name: f.name, servingLabel: f.servingLabel, servingG: f.servingG, kcal: Math.round(((f.per100.kcal ?? 0) * f.servingG) / 100), protein: +(((f.per100.protein ?? 0) * f.servingG) / 100).toFixed(1) }))} />

      {logs.length === 0 ? <Empty>No food logged {date === today ? "yet today" : "on this day"}.</Empty> : MEALS.filter((m) => logs.some((l) => l.meal === m)).map((m) => {
        const rows = logs.filter((l) => l.meal === m);
        return (
          <div key={m} className="card p-0">
            <div className="flex justify-between border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted"><span>{m}</span><span>{Math.round(sum(rows.map((r) => r.nutrients)).kcal ?? 0)} kcal</span></div>
            <div className="divide-y divide-line">
              {rows.map((l) => <FoodLogRow key={l.id} clientId={clientId} log={{ id: l.id, name: l.name, grams: l.grams, servings: l.servings, meal: l.meal, kcal: l.nutrients.kcal ?? 0, protein: l.nutrients.protein ?? 0, byTrainer: l.loggedBy === "trainer" }} />)}
            </div>
          </div>
        );
      })}

      <details className="card" open={logs.length > 0}>
        <summary className="cursor-pointer text-sm font-semibold">Vitamins &amp; minerals</summary>
        <div className="mt-3 space-y-3">{MICROS.map((m) => <Meter key={m.key} k={m.key} labelText={m.label} unit={m.unit} eaten={t(m.key)} target={targets[m.key]} />)}</div>
        <p className="mt-3 text-[11px] text-muted">Targets: ICMR-NIN 2020 adult RDA ({profile.sex ?? "assumed male: record sex in an assessment"}). Food values are approximate.</p>
      </details>

      <p className="px-1 text-[11px] text-muted">
        Targets {source.calculated ? `calculated: ${source.basis}` : "set by Prince"}.{canEditTargets ? "" : " Ask Prince if they look off."}
      </p>
    </div>
  );
}
