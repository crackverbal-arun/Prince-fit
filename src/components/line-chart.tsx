import { fmtDate } from "@/lib/dates";

// Single-series trend line. Every point has a hover/long-press readout (<title>).
export function LineChart({ points, unit, format, goodWhen }: {
  points: { date: string; value: number }[];
  unit: string;
  format?: (v: number) => string;
  goodWhen?: "up" | "down";
}) {
  if (points.length < 2) return null;
  const fmt = format ?? ((v: number) => `${+v.toFixed(1)}${unit}`);
  const W = 320, H = 130, P = 10;
  const vals = points.map((p) => p.value);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = hi - lo || 1;
  const x = (i: number) => P + (i / (points.length - 1)) * (W - 2 * P);
  const y = (v: number) => P + (1 - (v - lo) / span) * (H - 2 * P);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const first = points[0], last = points.at(-1)!;
  const change = last.value - first.value;
  const tone = !goodWhen || change === 0 ? "text-muted" : (change > 0) === (goodWhen === "up") ? "text-good" : "text-bad";
  const showDots = points.length <= 40;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-36 w-full overflow-visible" role="img" aria-label={`From ${fmt(first.value)} on ${fmtDate(first.date)} to ${fmt(last.value)} on ${fmtDate(last.date)}`}>
        <line x1={P} x2={W - P} y1={y(lo)} y2={y(lo)} stroke="#e7e8ec" strokeWidth="1" />
        <line x1={P} x2={W - P} y1={y(hi)} y2={y(hi)} stroke="#e7e8ec" strokeWidth="1" strokeDasharray="2 3" />
        <path d={`${d} L${x(points.length - 1)},${H} L${x(0)},${H} Z`} fill="#d7ff3a" opacity=".3" />
        <path d={d} fill="none" stroke="#0b0f19" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            {showDots && <circle cx={x(i)} cy={y(p.value)} r={i === points.length - 1 ? 4.5 : 3} fill={i === points.length - 1 ? "#d7ff3a" : "#fff"} stroke="#0b0f19" strokeWidth="2" />}
            {/* generous invisible hit target */}
            <circle cx={x(i)} cy={y(p.value)} r="12" fill="transparent"><title>{`${fmtDate(p.date)}: ${fmt(p.value)}`}</title></circle>
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 flex justify-between text-[11px] text-muted">
        <span>{fmtDate(first.date)} · {fmt(first.value)}</span>
        <span className={`font-semibold ${tone}`}>{change > 0 ? "+" : ""}{fmt(change).replace(/^\+?/, "")}</span>
        <span>{fmtDate(last.date)} · {fmt(last.value)}</span>
      </figcaption>
    </figure>
  );
}
