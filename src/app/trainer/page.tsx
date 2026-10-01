import Link from "next/link";
import { requireTrainer } from "@/lib/dal";
import { getClientSummaries } from "@/lib/queries";
import { rupees } from "@/lib/dates";
import { logout } from "@/app/actions/auth";
import { Avatar, Empty, Stat } from "@/components/ui";
import { ClientRow } from "@/components/client-row";

export default async function Dashboard() {
  const me = await requireTrainer();
  const all = await getClientSummaries();
  const active = all.filter((c) => c.active);
  const inToday = active.filter((c) => c.inToday);
  const attention = active.filter((c) => c.flags.length)
    .sort((a, b) => b.flags.length - a.flags.length || (b.daysSinceVisit ?? 99) - (a.daysSinceVisit ?? 99));
  const dues = active.reduce((s, c) => s + c.due, 0);
  const renewals = active.filter((c) => c.flags.some((f) => f.kind === "renewal" || f.kind === "nopackage")).length;

  return (
    <>
      <header className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" })}</p>
          <h1 className="text-2xl font-bold tracking-tight">Hey {me.name.split(" ")[0]} 👊</h1>
        </div>
        <form action={logout}><button className="text-xs font-medium text-muted underline underline-offset-2">Log out</button></form>
      </header>

      {active.length === 0 ? (
        <Empty>
          No clients yet.
          <Link href="/trainer/new" className="btn-primary mt-4 w-full">Add your first client</Link>
        </Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Checked in today" value={<>{inToday.length}<span className="text-base text-muted">/{active.length}</span></>} />
            <Stat label="Need a nudge" value={attention.length} sub="absent, diet, renewal or dues" />
            <Stat label="Dues outstanding" value={rupees(dues)} />
            <Stat label="Renewals due" value={renewals} sub="ending or ended" />
          </div>

          <h2 className="h-section">In the gym today</h2>
          {inToday.length ? (
            <div className="card flex gap-4 overflow-x-auto">
              {inToday.map((c) => (
                <Link key={c.id} href={`/trainer/clients/${c.id}`} className="flex w-14 shrink-0 flex-col items-center gap-1">
                  <Avatar name={c.name} size={44} />
                  <span className="w-full truncate text-center text-[11px]">{c.name.split(" ")[0]}</span>
                </Link>
              ))}
            </div>
          ) : <Empty>No one has checked in yet today.</Empty>}

          <h2 className="h-section">Needs attention</h2>
          {attention.length ? (
            <div className="card divide-y divide-line p-0">{attention.map((c) => <ClientRow key={c.id} c={c} nudge />)}</div>
          ) : <Empty>Everyone&apos;s on track. 🔥</Empty>}
          <p className="mt-2 px-1 text-[11px] text-muted">The green button opens WhatsApp with a reminder already written. Edit it before you send.</p>
        </>
      )}
    </>
  );
}
