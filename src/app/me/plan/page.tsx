import { requireClient } from "@/lib/dal";
import { getAttendance, getPackages, getWorkoutPlan } from "@/lib/queries";
import { addDays, DAYS, todayISO } from "@/lib/dates";
import { logout } from "@/app/actions/auth";
import { PackageCard } from "@/components/package-card";
import { AttendanceCalendar } from "@/components/attendance-calendar";
import { Empty } from "@/components/ui";
import { PasswordForm } from "./password-form";

export default async function MyPlan() {
  const me = await requireClient();
  const [{ current }, plan, att] = await Promise.all([getPackages(me.id), getWorkoutPlan(me.id), getAttendance(me.id, addDays(todayISO(), -45))]);
  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">My plan</h1>
      {current ? <PackageCard s={current} /> : <Empty>No active package. Talk to Prince.</Empty>}

      <h2 className="h-section">Attendance</h2>
      <div className="card"><AttendanceCalendar present={att} /></div>

      <h2 className="h-section">Weekly workout</h2>
      {plan.length ? (
        <div className="card divide-y divide-line p-0">
          {order.filter((d) => plan.some((p) => p.dayOfWeek === d)).map((d) => (
            <div key={d} className="px-4 py-3">
              <div className="mb-1 text-xs font-semibold text-muted">{DAYS[d]}</div>
              {plan.filter((p) => p.dayOfWeek === d).map((p) => (
                <div key={p.id} className="flex justify-between py-0.5 text-sm">
                  <span>{p.exercise}</span>
                  <span className="text-muted">{p.sets}×{p.reps}{p.targetKg ? ` · ${p.targetKg}kg` : ""}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : <Empty>Prince hasn&apos;t set your workout plan yet.</Empty>}

      <h2 className="h-section">Account</h2>
      <div className="card space-y-3">
        <div className="text-sm"><span className="text-muted">Logged in as</span> {me.name} · {me.phone}</div>
        <PasswordForm />
        <form action={logout}><button className="btn-ghost w-full text-bad">Log out</button></form>
      </div>
    </>
  );
}
