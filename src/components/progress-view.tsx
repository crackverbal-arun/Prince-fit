import { getBodyStats, getPRs } from "@/lib/queries";
import { fmtDate } from "@/lib/dates";
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
  const [stats, prs] = await Promise.all([getBodyStats(clientId), getPRs(clientId)]);
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

      <h2 className="h-section">Personal bests</h2>
      {prs.length ? (
        <div className="card divide-y divide-line p-0">
          {prs.map((p) => (
            <div key={p.exercise} className="flex items-center gap-3 px-4 py-3">
              <IconTrophy className="size-5 text-warn" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{p.exercise}</div>
                <div className="text-[11px] text-muted">{fmtDate(p.date)}</div>
              </div>
              <div className="text-right text-sm font-bold">{p.weightKg}kg <span className="font-medium text-muted">× {p.reps}</span></div>
            </div>
          ))}
        </div>
      ) : <Empty>Personal bests show up once workouts are logged.</Empty>}

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
