import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireTrainer } from "@/lib/dal";
import { getClientSummaries } from "@/lib/queries";
import { nudgeText, waLink } from "@/lib/whatsapp";
import { Avatar, Chip, flagTone } from "@/components/ui";
import { IconBack, IconWhatsApp } from "@/components/icons";
import { ProgressView } from "@/components/progress-view";
import { OverviewTab } from "./overview";
import { WorkoutTab } from "./workout";
import { DietTab } from "./diet";
import { PackageTab } from "./package";

const TABS = [["overview", "Overview"], ["workout", "Workout"], ["diet", "Diet"], ["progress", "Progress"], ["package", "Package"]] as const;

export default async function ClientPage(props: PageProps<"/trainer/clients/[id]">) {
  await requireTrainer();
  const { id } = await props.params;
  const tab = String((await props.searchParams).tab ?? "overview");
  const client = await db.query.users.findFirst({ where: and(eq(users.id, id), eq(users.role, "client")) });
  if (!client) notFound();
  const summary = (await getClientSummaries()).find((c) => c.id === id)!;

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
        {tab === "workout" ? <WorkoutTab clientId={id} />
          : tab === "diet" ? <DietTab clientId={id} />
          : tab === "progress" ? <ProgressView clientId={id} />
          : tab === "package" ? <PackageTab clientId={id} />
          : <OverviewTab client={client} />}
      </div>
    </>
  );
}
