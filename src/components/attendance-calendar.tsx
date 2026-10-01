import { addDays, dayOfWeek, todayISO } from "@/lib/dates";

// Last N weeks, Monday-first grid. `renderCell` lets Prince's view make cells tappable.
export function AttendanceCalendar({ present, weeks = 5, renderCell }: {
  present: Map<string, string>;
  weeks?: number;
  renderCell?: (date: string, isPresent: boolean, cell: React.ReactNode) => React.ReactNode;
}) {
  const today = todayISO();
  const mondayOffset = (dayOfWeek(today) + 6) % 7;
  const start = addDays(today, -mondayOffset - (weeks - 1) * 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1.5 text-center text-[10px] font-medium text-muted">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const future = d > today;
          const on = present.has(d);
          const cell = (
            <div className={`grid aspect-square place-items-center rounded-lg text-xs font-medium ${future ? "text-line" : on ? "bg-ink text-volt" : "bg-bg text-muted"} ${d === today ? "ring-2 ring-volt" : ""}`}>
              {Number(d.slice(8))}
            </div>
          );
          return <div key={d}>{renderCell && !future ? renderCell(d, on, cell) : cell}</div>;
        })}
      </div>
    </div>
  );
}
