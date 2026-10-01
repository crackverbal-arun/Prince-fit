import { fmtDate } from "@/lib/dates";

export function LineChart({ points, unit }: { points: { date: string; value: number }[]; unit: string }) {
  if (points.length < 2) return null;
  const W = 320, H = 120, P = 8;
  const vals = points.map((p) => p.value);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = hi - lo || 1;
  const x = (i: number) => P + (i / (points.length - 1)) * (W - 2 * P);
  const y = (v: number) => P + (1 - (v - lo) / span) * (H - 2 * P);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const last = points.at(-1)!;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-32 w-full" role="img" aria-label={`Trend from ${points[0].value}${unit} to ${last.value}${unit}`}>
        <path d={`${d} L${x(points.length - 1)},${H} L${x(0)},${H} Z`} fill="#d7ff3a" opacity=".35" />
        <path d={d} fill="none" stroke="#0b0f19" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(points.length - 1)} cy={y(last.value)} r="4.5" fill="#0b0f19" stroke="#d7ff3a" strokeWidth="2" />
      </svg>
      <figcaption className="mt-1 flex justify-between text-[11px] text-muted">
        <span>{fmtDate(points[0].date)} · {points[0].value}{unit}</span>
        <span>{fmtDate(last.date)} · {last.value}{unit}</span>
      </figcaption>
    </figure>
  );
}
