import { and, asc, eq } from "drizzle-orm";
import { db, workoutLogs } from "@/db";
import { fmtDate, fmtDuration } from "@/lib/dates";
import { fmtPace, logSummary } from "@/lib/format";
import { kindOf, metrics, overload, setsOf } from "@/lib/workout";
import { LineChart } from "./line-chart";
import { BarChart } from "./bar-chart";
import { Empty } from "./ui";

/** One exercise over time: charts for strength/endurance plus every session's sets. */
export async function ExerciseDetail({ clientId, name }: { clientId: string; name: string }) {
  const rows = await db.select().from(workoutLogs).where(and(eq(workoutLogs.clientId, clientId), eq(workoutLogs.exercise, name))).orderBy(asc(workoutLogs.date));
  if (!rows.length) return <Empty>No sessions logged for {name} yet.</Empty>;
  const kind = kindOf(rows.at(-1)!);
  const m = rows.map((r) => ({ date: r.date, ...metrics(r) }));
  const o = overload(rows);
  const charts: { title: string; note?: string; points: { date: string; value: number }[]; format: (v: number) => string; goodWhen: "up" | "down"; bars?: boolean }[] =
    kind === "weight" ? [
      { title: "Estimated 1-rep max", note: "Epley formula: lets 60kg×8 and 65kg×5 be compared", points: m.map((x) => ({ date: x.date, value: x.e1rm as number })), format: (v) => `${+v.toFixed(1)} kg`, goodWhen: "up" },
      { title: "Heaviest set", points: m.map((x) => ({ date: x.date, value: x.topKg as number })), format: (v) => `${v} kg`, goodWhen: "up" },
      { title: "Session volume", note: "sets × reps × kg", points: m.map((x) => ({ date: x.date, value: x.volume as number })), format: (v) => `${Math.round(v).toLocaleString("en-IN")} kg`, goodWhen: "up", bars: true },
    ] : kind === "time" ? [
      { title: "Longest hold", points: m.map((x) => ({ date: x.date, value: x.longest as number })), format: fmtDuration, goodWhen: "up" },
      { title: "Total time under tension", points: m.map((x) => ({ date: x.date, value: x.totalSec as number })), format: fmtDuration, goodWhen: "up", bars: true },
    ] : [
      { title: "Distance", points: m.filter((x) => x.distanceKm).map((x) => ({ date: x.date, value: x.distanceKm as number })), format: (v) => `${+v.toFixed(2)} km`, goodWhen: "up" },
      { title: "Duration", points: m.filter((x) => x.durationSec).map((x) => ({ date: x.date, value: x.durationSec as number })), format: fmtDuration, goodWhen: "up", bars: true },
      { title: "Pace", note: "lower is faster", points: m.filter((x) => x.paceSecPerKm).map((x) => ({ date: x.date, value: x.paceSecPerKm as number })), format: (v) => fmtPace(Math.round(v)), goodWhen: "down" },
      { title: "Calories burned", points: m.filter((x) => x.calories).map((x) => ({ date: x.date, value: x.calories as number })), format: (v) => `${Math.round(v)} kcal`, goodWhen: "up", bars: true },
    ];

  return (
    <div className="space-y-3">
      <div className="card grid grid-cols-3 gap-2 text-center text-xs">
        <div><div className="text-lg font-bold">{rows.length}</div><div className="text-muted">sessions</div></div>
        <div><div className="text-lg font-bold">{kind === "weight" ? `${o.best} kg` : kind === "time" ? fmtDuration(o.best) : `${+o.best.toFixed(2)} km`}</div><div className="text-muted">{kind === "weight" ? "best e1RM" : "best"}</div></div>
        <div><div className={`text-lg font-bold ${o.trend === "up" ? "text-good" : o.trend === "down" ? "text-warn" : ""}`}>{o.plateau ? "Plateau" : { up: "▲ Up", same: "Same", down: "▼ Down", first: "New" }[o.trend]}</div><div className="text-muted">vs last session</div></div>
      </div>
      {charts.filter((c) => c.points.length >= 2).map((c) => (
        <div key={c.title} className="card">
          <div className="mb-1 flex items-baseline justify-between"><span className="text-sm font-semibold">{c.title}</span>{c.note && <span className="text-[11px] text-muted">{c.note}</span>}</div>
          {c.bars
            ? <BarChart data={c.points.slice(-16).map((p, i, a) => ({ label: fmtDate(p.date), value: p.value, highlight: i === a.length - 1 }))} format={c.format} />
            : <LineChart points={c.points} unit="" format={c.format} goodWhen={c.goodWhen} />}
        </div>
      ))}
      {rows.length < 2 && <p className="px-1 text-xs text-muted">Charts appear after the second session.</p>}
      <h3 className="h-section">All sessions</h3>
      <div className="card divide-y divide-line p-0">
        {[...rows].reverse().map((r) => (
          <div key={r.id} className="px-4 py-2.5 text-sm">
            <div className="flex justify-between"><span className="font-semibold">{fmtDate(r.date)}</span><span className="text-xs text-muted">{r.loggedBy === "trainer" ? "logged by Prince" : ""}</span></div>
            {kind === "weight" ? (
              <div className="mt-1 flex flex-wrap gap-1">{setsOf(r).map((s, i) => <span key={i} className="rounded-md bg-bg px-1.5 py-0.5 text-xs ring-1 ring-line">{s.kg}kg × {s.reps}</span>)}</div>
            ) : <div className="text-muted">{logSummary(r)}</div>}
            {r.notes && <div className="mt-1 text-xs italic text-muted">“{r.notes}”</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
