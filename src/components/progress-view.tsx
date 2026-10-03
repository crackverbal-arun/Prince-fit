import { getBodyStats, getExerciseProgress, type ExerciseProgress } from "@/lib/queries";
import { fmtDate, fmtDuration } from "@/lib/dates";
import { logSummary } from "@/lib/format";
import { LineChart } from "./line-chart";
import { Empty } from "./ui";
import { IconTrophy } from "./icons";

function Delta({ first, last, goodWhenDown = true }: { first?: number | null; last?: number | null; goodWhenDown?: boolean }) {
  if (first == null || last == null) return <span className="text-muted">—</span>;
  const diff = +(last - first).toFixed(1);
  const good = goodWhenDown ? diff < 0 : diff > 0;
  return (
    <span>
      <span className="text-lg font-bold">{last}</span>{" "}
      {diff !== 0 && <span className={`text-xs font-semibold ${good ? "text-good" : "text-warn"}`}>{diff > 0 ? "+" : ""}{diff}</span>}
    </span>
  );
}

// Shared by the client's Progress tab and Prince's view of a client.
export async function ProgressView({ clientId }: { clientId: string }) {
  const [stats, exercises] = await Promise.all([getBodyStats(clientId), getExerciseProgress(clientId)]);
  const firstOf = (k: "weightKg" | "waistCm" | "chestCm" | "armCm") => stats.find((s) => s[k] != null)?.[k];
  const lastOf = (k: "weightKg" | "waistCm" | "chestCm" | "armCm") => stats.findLast((s) => s[k] != null)?.[k];
  const weights = stats.filter((s) => s.weightKg != null).map((s) => ({ date: s.date, value: s.weightKg! }));
  const photos = stats.filter((s) => s.photo).reverse();

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="mb-2 text-sm font-semibold">Body weight</div>
        {weights.length >= 2 ? <LineChart points={weights} unit="kg" /> : <p className="text-sm text-muted">Log your weight twice to see the trend.</p>}
        <div className="mt-3 grid grid-cols-4 gap-2 border-t border-line pt-3 text-center">
          {([["Weight", "weightKg", true], ["Waist", "waistCm", true], ["Chest", "chestCm", false], ["Arm", "armCm", false]] as const).map(([l, k, down]) => (
            <div key={k}>
              <div className="text-[11px] text-muted">{l}</div>
              <Delta first={firstOf(k)} last={lastOf(k)} goodWhenDown={down} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">Change since first entry. Weight in kg, the rest in cm.</p>
      </div>

      <h2 className="h-section">Workout progress</h2>
      {exercises.length ? (
        <div className="space-y-2">{exercises.map((e) => <ExerciseCard key={e.exercise} e={e} />)}</div>
      ) : <Empty>Progress shows up here once workouts are logged.</Empty>}

      <h2 className="h-section">Progress photos</h2>
      {photos.length ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <figure key={p.id} className="overflow-hidden rounded-xl ring-1 ring-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo!} alt={`Progress ${p.date}`} className="aspect-[3/4] w-full object-cover" />
              <figcaption className="bg-surface py-1 text-center text-[10px] text-muted">{fmtDate(p.date)}</figcaption>
            </figure>
          ))}
        </div>
      ) : <Empty>No progress photos yet.</Empty>}
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="h-10 w-24" />;
  const W = 96, H = 40, P = 3;
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  const pts = values.map((v, i) => `${(P + (i / (values.length - 1)) * (W - 2 * P)).toFixed(1)},${(P + (1 - (v - lo) / span) * (H - 2 * P)).toFixed(1)}`);
  const [lx, ly] = pts.at(-1)!.split(",");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-10 w-24 shrink-0" aria-hidden>
      <polyline points={pts.join(" ")} fill="none" stroke="#0b0f19" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="3" fill="#d7ff3a" stroke="#0b0f19" strokeWidth="1.5" />
    </svg>
  );
}

function ExerciseCard({ e }: { e: ExerciseProgress }) {
  const fmt = (v: number) => (e.timed ? fmtDuration(v) : `${v}kg`);
  const pct = e.first > 0 ? Math.round(((e.latest - e.first) / e.first) * 100) : 0;
  return (
    <div className="card flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{e.exercise}</span>
          {e.timed && <span className="rounded bg-bg px-1 text-[9px] font-semibold text-muted ring-1 ring-line">TIME</span>}
        </div>
        <div className="mt-0.5 text-sm">
          {e.sessions > 1 ? <>{fmt(e.first)} → <b>{fmt(e.latest)}</b></> : <b>{fmt(e.latest)}</b>}
          {e.sessions > 1 && pct !== 0 && <span className={`ml-1.5 text-xs font-semibold ${pct > 0 ? "text-good" : "text-warn"}`}>{pct > 0 ? "+" : ""}{pct}%</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
          <IconTrophy className="size-3 text-warn" />Best {logSummary(e.best)} · {fmtDate(e.best.date)} · {e.sessions} session{e.sessions > 1 ? "s" : ""}
        </div>
      </div>
      <Sparkline values={e.points.map((p) => p.value)} />
    </div>
  );
}
