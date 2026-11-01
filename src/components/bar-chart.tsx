// Single-series bars (one per day/week) with an optional target line.
// Hover/long-press any bar for its exact value.
export function BarChart({ data, target, format, targetLabel }: {
  data: { label: string; value: number; title?: string; highlight?: boolean }[];
  target?: number;
  format: (v: number) => string;
  targetLabel?: string;
}) {
  const W = 320, H = 140, top = 14, bottom = 18;
  const max = Math.max(1, target ?? 0, ...data.map((d) => d.value)) * 1.08;
  const plotH = H - top - bottom;
  const gap = 2, bw = (W - gap * (data.length - 1)) / data.length;
  const y = (v: number) => top + plotH - (v / max) * plotH;
  const labelEvery = Math.ceil(data.length / 8);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full overflow-visible" role="img" aria-label={data.map((d) => `${d.title ?? d.label}: ${format(d.value)}`).join("; ")}>
      <line x1="0" x2={W} y1={top + plotH} y2={top + plotH} stroke="#e7e8ec" />
      {data.map((d, i) => {
        const h = Math.max(d.value > 0 ? 2 : 0, (d.value / max) * plotH), x0 = i * (bw + gap), r = Math.min(4, bw / 2, h);
        return (
          <g key={i}>
            {h > 0 && <path d={`M${x0},${top + plotH} V${top + plotH - h + r} Q${x0},${top + plotH - h} ${x0 + r},${top + plotH - h} H${x0 + bw - r} Q${x0 + bw},${top + plotH - h} ${x0 + bw},${top + plotH - h + r} V${top + plotH} Z`}
              fill={d.highlight ? "#0b0f19" : "#9ca3af"} />}
            <rect x={x0} y={top} width={bw} height={plotH + bottom} fill="transparent"><title>{`${d.title ?? d.label}: ${format(d.value)}`}</title></rect>
            {i % labelEvery === 0 && <text x={x0 + bw / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="#6b7280">{d.label}</text>}
          </g>
        );
      })}
      {target ? (
        <g>
          <line x1="0" x2={W} y1={y(target)} y2={y(target)} stroke="#0b0f19" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x={W} y={y(target) - 4} textAnchor="end" fontSize="9" fontWeight="600" fill="#0b0f19">{targetLabel ?? `Target ${format(target)}`}</text>
        </g>
      ) : null}
    </svg>
  );
}
