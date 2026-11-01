import Link from "next/link";
import { requireClient } from "@/lib/dal";
import { getSessions } from "@/lib/q-client";
import { fmtTime, longDate } from "@/lib/schedule";
import { IconChevron } from "@/components/icons";
import { getAttendance, getPackages, getWorkoutPlan } from "@/lib/queries";
import { addDays, DAYS, todayISO } from "@/lib/dates";
import { logout } from "@/app/actions/auth";
import { planTarget } from "@/lib/format";
import { PackageCard } from "@/components/package-card";
import { AttendanceCalendar, toMarks } from "@/components/attendance-calendar";
import { Empty } from "@/components/ui";
import { PasswordForm } from "./password-form";

export default async function MyPlan() {
  const me = await requireClient();
  const [{ current }, plan, att, upcoming] = await Promise.all([getPackages(me.id), getWorkoutPlan(me.id), getAttendance(me.id, addDays(todayISO(), -45)),
    getSessions({ from: todayISO(), to: addDays(todayISO(), 60), clientId: me.id }).then((r) => r.filter((x) => x.s.status === "scheduled"))]);
  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">My plan</h1>
      {current ? <PackageCard s={current} /> : <Empty>No active package. Talk to Prince.</Empty>}

      <h2 className="h-section">Upcoming sessions</h2>
      {upcoming.length ? (
        <div className="card divide-y divide-line p-0">
          {upcoming.slice(0, 6).map(({ s }) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-semibold">{longDate(s.date)}</span><span className="text-muted">{fmtTime(s.startTime)} · {s.title ?? "Training"}</span>
            </div>
          ))}
        </div>
      ) : <Empty>No sessions booked yet.</Empty>}

      <Link href="/me/bmi" className="card mt-3 flex items-center justify-between">
        <span><span className="block font-semibold">BMI calculator</span><span className="text-xs text-muted">BMI, healthy weight range, body fat estimate</span></span>
        <IconChevron className="size-4 text-muted" />
      </Link>
      <Link href="/me/assessment" className="card mt-3 flex items-center justify-between">
        <span><span className="block font-semibold">Fitness assessment</span><span className="text-xs text-muted">Baseline and 3-month results</span></span>
        <IconChevron className="size-4 text-muted" />
      </Link>

      <h2 className="h-section">Attendance</h2>
      <div className="card"><AttendanceCalendar marks={toMarks(att)} /></div>

      <h2 className="h-section">Weekly workout</h2>
      {plan.length ? (
        <div className="card divide-y divide-line p-0">
          {order.filter((d) => plan.some((p) => p.dayOfWeek === d)).map((d) => (
            <div key={d} className="px-4 py-3">
              <div className="mb-1 text-xs font-semibold text-muted">{DAYS[d]}</div>
              {plan.filter((p) => p.dayOfWeek === d).map((p) => (
                <div key={p.id} className="flex justify-between py-0.5 text-sm">
                  <span>{p.exercise}</span>
                  <span className="text-muted">{planTarget(p)}</span>
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
