import Link from "next/link";
import { requireClient } from "@/lib/dal";
import { todayISO } from "@/lib/dates";
import { WorkoutProgress } from "@/components/workout-progress";
import { BodyView } from "@/components/body-view";
import { History } from "@/components/history";

const VIEWS = [["workouts", "Workouts"], ["body", "Body"], ["history", "History"]] as const;

export default async function Progress(props: PageProps<"/me/progress">) {
  const me = await requireClient();
  const sp = await props.searchParams;
  const view = VIEWS.find(([k]) => k === sp.view)?.[0] ?? "workouts";
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : todayISO().slice(0, 7);
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Progress</h1>
      {me.goal && <p className="mb-3 text-sm text-muted">Goal: {me.goal}</p>}
      <div className="mb-4 flex gap-1 rounded-xl bg-bg p-1 ring-1 ring-line">
        {VIEWS.map(([k, l]) => <Link key={k} href={`?view=${k}`} replace scroll={false} className={`flex-1 rounded-lg py-2 text-center text-sm font-semibold ${view === k ? "bg-surface shadow-sm ring-1 ring-line" : "text-muted"}`}>{l}</Link>)}
      </div>
      {view === "workouts" ? <WorkoutProgress clientId={me.id} exerciseHref={(n) => `/me/progress/exercise?name=${encodeURIComponent(n)}`} />
        : view === "body" ? <BodyView clientId={me.id} metric={typeof sp.metric === "string" ? sp.metric : undefined} href={(p) => `?view=body&metric=${p.metric ?? ""}`} bmiHref="/me/bmi" />
        : <History clientId={me.id} month={month} monthHref={(m) => `?view=history&month=${m}`} editHref={(d) => `/me/log?date=${d}`} />}
    </>
  );
}
