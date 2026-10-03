import { addDays, dayOfWeek, fmtDate, todayISO } from "@/lib/dates";

export type DayMark = { status: "present" | "absent"; reason: string | null };
export type Marks = Record<string, DayMark>;

// Last N weeks, Monday-first grid. `renderCell` lets Prince's view make cells tappable.
export function AttendanceCalendar({ marks, weeks = 5, renderCell }: {
  marks: Marks;
  weeks?: number;
  renderCell?: (date: string, cell: React.ReactNode) => React.ReactNode;
}) {
  const today = todayISO();
  const mondayOffset = (dayOfWeek(today) + 6) % 7;
  const start = addDays(today, -mondayOffset - (weeks - 1) * 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  const inRange = Object.entries(marks).filter(([d]) => d >= start);
  const present = inRange.filter(([, m]) => m.status === "present").length;
  const absences = inRange.filter(([, m]) => m.status === "absent").sort(([a], [b]) => b.localeCompare(a));

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1.5 text-center text-[10px] font-medium text-muted">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const future = d > today;
          const m = marks[d];
          const tone = future ? "text-line" : m?.status === "present" ? "bg-ink text-volt" : m?.status === "absent" ? "bg-red-50 text-bad ring-1 ring-red-200" : "bg-bg text-muted";
          const cell = (
            <div className={`relative grid aspect-square place-items-center rounded-lg text-xs font-medium ${tone} ${d === today ? "outline-2 outline-offset-1 outline-volt" : ""}`}>
              {Number(d.slice(8))}
              {m?.status === "absent" && <span className="absolute bottom-1 size-1 rounded-full bg-bad" />}
            </div>
          );
          return <div key={d}>{renderCell && !future ? renderCell(d, cell) : cell}</div>;
        })}
      </div>
      <div className="mt-3 flex gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-ink" />Present · {present}</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-red-100 ring-1 ring-red-300" />Absent · {absences.length}</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-bg ring-1 ring-line" />Not marked</span>
      </div>
      {absences.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          {absences.map(([d, m]) => (
            <li key={d} className="flex gap-2"><span className="w-14 shrink-0 text-muted">{fmtDate(d)}</span><span>{m.reason ?? "No reason given"}</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function toMarks(map: Map<string, DayMark>): Marks {
  return Object.fromEntries([...map].map(([d, m]) => [d, { status: m.status, reason: m.reason }]));
}
