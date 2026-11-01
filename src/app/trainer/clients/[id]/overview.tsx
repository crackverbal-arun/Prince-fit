import Link from "next/link";
import type { User } from "@/db";
import { getAttendance, getAssessments, getPackages, getWorkoutLogs } from "@/lib/queries";
import { getDailyNutrition, getNextSession, getTargets } from "@/lib/q-client";
import { getBodyStats } from "@/lib/queries";
import { addDays, daysBetween, fmtDate, todayISO } from "@/lib/dates";
import { REVIEW_EVERY_DAYS } from "@/lib/assessment";
import { fmtTime, longDate } from "@/lib/schedule";
import { setActive, updateClient } from "@/app/actions/trainer";
import { toMarks } from "@/components/attendance-calendar";
import { Submit } from "@/components/submit";
import { AttendanceEditor } from "./attendance-editor";
import { ResetPassword } from "./reset-password";
import { DeleteClient } from "./delete-client";

function Tile({ href, label, value, sub, tone }: { href: string; label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "good" | "warn" | "bad" }) {
  const t = tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "";
  return (
    <Link href={href} replace scroll={false} className="card block p-3">
      <div className="text-[11px] font-medium text-muted">{label}</div>
      <div className={`mt-0.5 truncate text-lg font-bold tracking-tight ${t}`}>{value}</div>
      {sub && <div className="truncate text-[11px] text-muted">{sub}</div>}
    </Link>
  );
}

/** One screen that pulls together schedule, attendance, training, nutrition, body, assessment and package. */
export async function OverviewTab({ client }: { client: User }) {
  const today = todayISO();
  const [att, logs, next, { targets }, nutrition, body, assessments, pkgs] = await Promise.all([
    getAttendance(client.id, addDays(today, -60)), getWorkoutLogs(client.id, addDays(today, -30)), getNextSession(client.id),
    getTargets(client.id), getDailyNutrition(client.id, addDays(today, -6), today), getBodyStats(client.id), getAssessments(client.id), getPackages(client.id),
  ]);
  const present30 = [...att].filter(([d, a]) => a.status === "present" && d > addDays(today, -30)).length;
  const absent30 = [...att].filter(([d, a]) => a.status === "absent" && d > addDays(today, -30)).length;
  const lastWorkout = logs[0];
  const day = nutrition.at(-1)!;
  const logged7 = nutrition.filter((d) => d.entries);
  const avgKcal = logged7.length ? Math.round(logged7.reduce((s, d) => s + (d.totals.kcal ?? 0), 0) / logged7.length) : 0;
  const weights = body.filter((b) => b.weightKg != null);
  const w = weights.at(-1), w30 = weights.findLast((b) => b.date <= addDays(today, -30)) ?? weights[0];
  const lastA = assessments.at(-1);
  const dueIn = lastA ? daysBetween(today, addDays(lastA.date, REVIEW_EVERY_DAYS)) : null;
  const pkg = pkgs.current;
  const tab = (t: string) => `?tab=${t}`;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Tile href={tab("schedule")} label="Next session" value={next ? `${longDate(next.s.date).split(",")[0]} ${fmtTime(next.s.startTime)}` : "None booked"} sub={next ? next.s.title ?? "Training" : "Tap to schedule"} tone={next ? undefined : "warn"} />
        <Tile href={tab("history")} label="Attendance · 30 days" value={`${present30} present`} sub={absent30 ? `${absent30} absent` : "no absences"} tone={absent30 > present30 ? "bad" : undefined} />
        <Tile href={tab("progress")} label="Last workout" value={lastWorkout ? fmtDate(lastWorkout.date) : "None in 30 days"} sub={lastWorkout ? `${new Set(logs.map((l) => l.date)).size} workouts in 30 days` : undefined} tone={lastWorkout ? undefined : "warn"} />
        <Tile href={tab("nutrition")} label="Food today" value={`${Math.round(day.totals.kcal ?? 0)} / ${targets.kcal} kcal`} sub={logged7.length ? `7-day avg ${avgKcal} kcal · ${logged7.length}/7 days logged` : "Nothing logged this week"} tone={logged7.length < 3 ? "warn" : undefined} />
        <Tile href={tab("nutrition")} label="Water today" value={`${(day.waterMl / 1000).toFixed(1)} / ${(targets.waterMl / 1000).toFixed(1)} L`} tone={day.waterMl >= targets.waterMl ? "good" : undefined} />
        <Tile href={tab("body")} label="Weight" value={w ? `${w.weightKg} kg` : "—"} sub={w && w30 && w30.id !== w.id ? `${(w.weightKg! - w30.weightKg!) > 0 ? "+" : ""}${(w.weightKg! - w30.weightKg!).toFixed(1)} kg since ${fmtDate(w30.date)}` : "Log weight in Body"} />
        <Tile href={tab("assessment")} label="Assessment" value={lastA ? (dueIn! <= 0 ? "Due now" : `Due in ${dueIn}d`) : "No baseline"} sub={lastA ? `Last ${fmtDate(lastA.date)}` : "Start one"} tone={!lastA || dueIn! <= 0 ? "bad" : dueIn! <= 7 ? "warn" : undefined} />
        <Tile href={tab("package")} label="Package" value={pkg ? `${pkg.left} sessions left` : "None"} sub={pkg ? (pkg.due ? `₹${pkg.due.toLocaleString("en-IN")} due` : `ends ${fmtDate(pkg.pkg.endDate)}`) : "Add one"} tone={!pkg || pkg.expired ? "bad" : pkg.due ? "warn" : undefined} />
      </div>

      <Link href={`/trainer/clients/${client.id}/log`} className="btn-primary w-full">Log today&apos;s session for {client.name.split(" ")[0]}</Link>

      <section className="card">
        <div className="mb-3 flex items-baseline justify-between"><span className="text-sm font-semibold">Attendance</span><span className="text-[11px] text-muted">Tap a day: present or absent</span></div>
        <AttendanceEditor clientId={client.id} marks={toMarks(att)} />
      </section>

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
          <button className={`btn-ghost w-full ${client.active ? "text-warn" : ""}`}>{client.active ? "Pause client (blocks login)" : "Reactivate client"}</button>
        </form>
        <DeleteClient clientId={client.id} name={client.name} />
      </div>
    </div>
  );
}
