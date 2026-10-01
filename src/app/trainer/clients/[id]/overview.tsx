import type { User } from "@/db";
import { getAttendance, getMealLogs, getMealPlan, getWorkoutLogs } from "@/lib/queries";
import { addDays, fmtDate, todayISO } from "@/lib/dates";
import { setActive, toggleAttendance, updateClient } from "@/app/actions/trainer";
import { AttendanceCalendar } from "@/components/attendance-calendar";
import { Submit } from "@/components/submit";
import { Bar, Empty } from "@/components/ui";
import { ResetPassword } from "./reset-password";

export async function OverviewTab({ client }: { client: User }) {
  const today = todayISO();
  const since = addDays(today, -6);
  const [att, logs, meals, mealLogs] = await Promise.all([
    getAttendance(client.id, addDays(today, -60)),
    getWorkoutLogs(client.id, addDays(today, -14)),
    getMealPlan(client.id),
    getMealLogs(client.id, since),
  ]);
  const possible = meals.length * 7;
  const byDate = Map.groupBy(logs, (l) => l.date);

  return (
    <div className="space-y-3">
      <section className="card">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm font-semibold">Attendance</span>
          <span className="text-[11px] text-muted">Tap a day to mark or unmark</span>
        </div>
        <AttendanceCalendar
          present={att}
          renderCell={(date, _on, cell) => (
            <form action={toggleAttendance.bind(null, client.id, date)}>
              <button className="w-full" aria-label={`Toggle ${date}`}>{cell}</button>
            </form>
          )}
        />
      </section>

      <section className="card">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold">Diet, last 7 days</span>
          <span className="text-muted">{mealLogs.length}/{possible} meals ticked</span>
        </div>
        {possible ? <Bar value={mealLogs.length} max={possible} tone="volt" /> : <p className="text-sm text-muted">No meal plan yet.</p>}
        {mealLogs.some((m) => m.photo) && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {mealLogs.filter((m) => m.photo).map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={m.id} src={m.photo!} alt={`Meal ${m.date}`} className="size-16 shrink-0 rounded-lg object-cover ring-1 ring-line" />
            ))}
          </div>
        )}
      </section>

      <h2 className="h-section">Recent workouts</h2>
      {byDate.size ? (
        <div className="card divide-y divide-line p-0">
          {[...byDate].map(([date, rows]) => (
            <div key={date} className="px-4 py-3">
              <div className="mb-1 text-xs font-semibold text-muted">{fmtDate(date)}</div>
              {rows.map((r) => (
                <div key={r.id} className="flex justify-between text-sm"><span>{r.exercise}</span><span className="text-muted">{r.sets}×{r.reps} @ {r.weightKg}kg</span></div>
              ))}
            </div>
          ))}
        </div>
      ) : <Empty>Nothing logged in the last 2 weeks.</Empty>}

      <h2 className="h-section">Details</h2>
      <form action={updateClient.bind(null, client.id)} className="card space-y-3">
        <label className="block"><span className="label">Name</span><input name="name" defaultValue={client.name} className="input" /></label>
        <label className="block"><span className="label">Goal</span><input name="goal" defaultValue={client.goal ?? ""} className="input" /></label>
        <label className="block"><span className="label">Note to client (shows on their home screen)</span>
          <textarea name="note" defaultValue={client.trainerNote ?? ""} rows={3} className="input h-auto py-2" placeholder="e.g. Great week! Push the squat to 60kg on Friday." /></label>
        <Submit>Save</Submit>
      </form>

      <div className="card space-y-2">
        <ResetPassword clientId={client.id} />
        <form action={setActive.bind(null, client.id, !client.active)}>
          <button className={`btn-ghost w-full ${client.active ? "text-bad" : ""}`}>{client.active ? "Pause client (blocks login)" : "Reactivate client"}</button>
        </form>
      </div>
    </div>
  );
}
