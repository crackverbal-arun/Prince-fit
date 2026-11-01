import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireTrainer } from "@/lib/dal";
import { getAssessments, getClientSummaries } from "@/lib/queries";
import { todayISO } from "@/lib/dates";
import { AssessmentReport } from "@/components/assessment-report";
import { WorkoutProgress } from "@/components/workout-progress";
import { History } from "@/components/history";
import { NutritionView } from "@/components/nutrition-view";
import { TargetsForm } from "@/components/targets-form";
import { BodyView } from "@/components/body-view";
import { nudgeText, waLink } from "@/lib/whatsapp";
import { Avatar, Chip, flagTone } from "@/components/ui";
import { IconBack, IconWhatsApp } from "@/components/icons";
import { OverviewTab } from "./overview";
import { WorkoutTab } from "./workout";
import { DietTab } from "./diet";
import { PackageTab } from "./package";
import { ScheduleTab } from "./schedule";

const TABS = [["overview", "Overview"], ["schedule", "Schedule"], ["workout", "Workout"], ["progress", "Progress"], ["history", "History"],
  ["nutrition", "Nutrition"], ["body", "Body"], ["assessment", "Assessment"], ["package", "Package"]] as const;

export default async function ClientPage(props: PageProps<"/trainer/clients/[id]">) {
  await requireTrainer();
  const { id } = await props.params;
  const sp = await props.searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const tab = str("tab") ?? "overview";
  const client = await db.query.users.findFirst({ where: and(eq(users.id, id), eq(users.role, "client")) });
  if (!client) notFound();
  const summary = (await getClientSummaries()).find((c) => c.id === id)!;
  const base = `/trainer/clients/${id}`;
  const today = todayISO();
  const date = str("date") && /^\d{4}-\d{2}-\d{2}$/.test(str("date")!) && str("date")! <= today ? str("date")! : today;

  return (
    <>
      <Link href="/trainer/clients" className="-ml-1 mb-3 inline-flex items-center text-sm text-muted"><IconBack className="size-4" />Clients</Link>
      <header className="flex items-center gap-3">
        <Avatar name={client.name} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight">{client.name}</h1>
          <div className="text-sm text-muted">{client.phone}{client.goal && ` · ${client.goal}`}</div>
        </div>
        <a href={waLink(client.phone, nudgeText(client.name, summary.flags))} target="_blank" rel="noreferrer" aria-label="WhatsApp"
          className="grid size-11 place-items-center rounded-full bg-[#25D366] text-white"><IconWhatsApp className="size-5" /></a>
      </header>
      {(summary.flags.length > 0 || !client.active) && (
        <div className="mt-3 flex flex-wrap gap-1">
          {!client.active && <Chip>Paused</Chip>}
          {summary.flags.map((f) => <Chip key={f.kind} tone={flagTone(f.kind)}>{f.label}</Chip>)}
        </div>
      )}

      <nav className="-mx-4 mt-4 flex gap-1 overflow-x-auto px-4 pb-1">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`?tab=${k}`} replace scroll={false}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${tab === k ? "bg-ink text-white" : "bg-surface text-muted ring-1 ring-line"}`}>{l}</Link>
        ))}
      </nav>

      <div className="mt-4">
        {tab === "schedule" ? <ScheduleTab clientId={id} />
          : tab === "workout" ? <WorkoutTab clientId={id} />
          : tab === "progress" ? <WorkoutProgress clientId={id} exerciseHref={(n) => `${base}/exercise?name=${encodeURIComponent(n)}`} />
          : tab === "history" ? <History clientId={id} month={/^\d{4}-\d{2}$/.test(str("month") ?? "") ? str("month")! : today.slice(0, 7)} monthHref={(m) => `?tab=history&month=${m}`} editHref={(d) => `${base}/log?date=${d}`} />
          : tab === "nutrition" ? (
            <div className="space-y-3">
              <TargetsForm clientId={id} />
              <NutritionView clientId={id} date={date} range={(["day", "week", "month"] as const).find((r) => r === str("range")) ?? "day"} canEditTargets
                href={(p) => `?tab=nutrition&date=${p.date ?? date}&range=${p.range ?? "day"}`} />
              <h2 className="h-section">Diet plan (what Prince prescribes)</h2>
              <DietTab clientId={id} />
            </div>
          )
          : tab === "body" ? <BodyView clientId={id} metric={str("metric")} href={(p) => `?tab=body&metric=${p.metric ?? ""}`} bmiHref={`/trainer/bmi?client=${id}`} />
          : tab === "package" ? <PackageTab clientId={id} />
          : tab === "assessment" ? <AssessmentReport list={await getAssessments(id)} selectedId={str("a")} vs={str("vs")} justSaved={str("done") === "1"} clientId={id} editable />
          : <OverviewTab client={client} />}
      </div>
    </>
  );
}
