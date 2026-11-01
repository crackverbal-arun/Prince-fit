import Link from "next/link";
import { getExerciseProgress, getWorkoutLogs, type ExerciseProgress } from "@/lib/queries";
import { addDays, dayOfWeek, fmtDate, fmtDuration, todayISO } from "@/lib/dates";
import { metrics } from "@/lib/workout";
import { logSummary } from "@/lib/format";
import { BarChart } from "./bar-chart";
import { Empty } from "./ui";
import { IconChevron, IconTrophy } from "./icons";

export const fmtScore = (e: { kind: string }, v: number) =>
  e.kind === "time" ? fmtDuration(v) : e.kind === "cardio" ? `${+v.toFixed(2)} km` : `${+v.toFixed(1)} kg`;

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="h-10 w-20" />;
  const W = 80, H = 36, P = 4, lo = Math.min(...values), span = Math.max(...values) - lo || 1;
  const pts = values.map((v, i) => `${(P + (i / (values.length - 1)) * (W - 2 * P)).toFixed(1)},${(P + (1 - (v - lo) / span) * (H - 2 * P)).toFixed(1)}`);
  return <svg viewBox={`0 0 ${W} ${H}`} className="h-9 w-20 shrink-0" aria-hidden><polyline points={pts.join(" ")} fill="none" stroke="#0b0f19" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>;
}

const STATUS = {
  up: ["Overloading", "text-good"], same: ["Holding", "text-muted"], down: ["Dipped", "text-warn"], first: ["New", "text-muted"],
} as const;

function Card({ e, href }: { e: ExerciseProgress; href: string }) {
  const pct = e.first > 0 ? Math.round(((e.latest - e.first) / e.first) * 100) : 0;
  const [label, tone] = STATUS[e.trend.trend];
  return (
    <Link href={href} className="card flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{e.exercise}</span>
          {e.kind !== "weight" && <span className="rounded bg-bg px-1 text-[9px] font-semibold uppercase text-muted ring-1 ring-line">{e.kind}</span>}
        </div>
        <div className="mt-0.5 text-sm">
          {e.sessions > 1 ? <>{fmtScore(e, e.first)} → <b>{fmtScore(e, e.latest)}</b></> : <b>{fmtScore(e, e.latest)}</b>}
          {e.sessions > 1 && pct !== 0 && <span className={`ml-1.5 text-xs font-semibold ${pct > 0 ? "text-good" : "text-warn"}`}>{pct > 0 ? "+" : ""}{pct}%</span>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
          <span className={`font-semibold ${tone}`}>{label}</span>
          {e.trend.plateau && <span className="font-semibold text-warn">Plateau</span>}
          <span className="flex items-center gap-1"><IconTrophy className="size-3 text-warn" />{logSummary(e.best)}</span>
        </div>
      </div>
      <Spark values={e.points.map((p) => p.value)} />
      <IconChevron className="size-4 shrink-0 text-muted" />
    </Link>
  );
}

/** Workout progress for a client: weekly training load + one card per exercise. */
export async function WorkoutProgress({ clientId, exerciseHref }: { clientId: string; exerciseHref: (name: string) => string }) {
  const [list, logs] = await Promise.all([getExerciseProgress(clientId), getWorkoutLogs(clientId)]);
  if (!list.length) return <Empty>Progress shows up here once workouts are logged.</Empty>;

  const today = todayISO();
  const monday = addDays(today, -((dayOfWeek(today) + 6) % 7));
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(monday, (i - 7) * 7));
  const perWeek = weeks.map((w) => {
    const rows = logs.filter((l) => l.date >= w && l.date < addDays(w, 7));
    return { w, days: new Set(rows.map((r) => r.date)).size, volume: rows.reduce((s, r) => s + ((metrics(r).volume as number | undefined) ?? 0), 0) };
  });
  const groups = { weight: list.filter((e) => e.kind === "weight"), time: list.filter((e) => e.kind === "time"), cardio: list.filter((e) => e.kind === "cardio") };
  const overloading = groups.weight.filter((e) => e.trend.trend === "up").length;
  const plateaus = list.filter((e) => e.trend.plateau).map((e) => e.exercise);

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold">Weekly lifting volume</span>
          <span className="text-[11px] text-muted">kg lifted (sets × reps × kg)</span>
        </div>
        <BarChart data={perWeek.map((p, i) => ({ label: fmtDate(p.w), title: `Week of ${fmtDate(p.w)} · ${p.days} workout day${p.days === 1 ? "" : "s"}`, value: p.volume, highlight: i === perWeek.length - 1 }))}
          format={(v) => `${Math.round(v).toLocaleString("en-IN")} kg`} />
        <div className="mt-2 grid grid-cols-3 gap-2 border-t border-line pt-2 text-center text-xs">
          <div><div className="text-lg font-bold">{perWeek.at(-1)!.days}</div><div className="text-muted">days this week</div></div>
          <div><div className="text-lg font-bold text-good">{overloading}</div><div className="text-muted">lifts going up</div></div>
          <div><div className={`text-lg font-bold ${plateaus.length ? "text-warn" : ""}`}>{plateaus.length}</div><div className="text-muted">plateaus</div></div>
        </div>
        {plateaus.length > 0 && <p className="mt-2 text-xs text-warn">No new best in 3 sessions: {plateaus.join(", ")}. Consider changing reps, tempo or a deload.</p>}
      </div>
      {(["weight", "time", "cardio"] as const).filter((k) => groups[k].length).map((k) => (
        <div key={k} className="space-y-2">
          <h3 className="h-section !mt-4">{k === "weight" ? "Strength (estimated 1-rep max)" : k === "time" ? "Timed holds" : "Cardio (distance)"}</h3>
          {groups[k].map((e) => <Card key={e.exercise} e={e} href={exerciseHref(e.exercise)} />)}
        </div>
      ))}
    </div>
  );
}
