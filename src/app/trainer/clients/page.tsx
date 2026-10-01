import { requireTrainer } from "@/lib/dal";
import { getClientSummaries } from "@/lib/queries";
import { ClientRow } from "@/components/client-row";
import { Empty } from "@/components/ui";
import { ClientSearch } from "./search";

export default async function Clients(props: PageProps<"/trainer/clients">) {
  await requireTrainer();
  const q = String((await props.searchParams).q ?? "").toLowerCase().trim();
  const all = (await getClientSummaries()).filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q));
  const active = all.filter((c) => c.active);
  const inactive = all.filter((c) => !c.active);
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Clients</h1>
      <ClientSearch initial={q} />
      <div className="mt-3">
        {active.length ? <div className="card divide-y divide-line p-0">{active.map((c) => <ClientRow key={c.id} c={c} />)}</div>
          : <Empty>{q ? "No match." : "No clients yet."}</Empty>}
      </div>
      {inactive.length > 0 && (
        <>
          <h2 className="h-section">Paused</h2>
          <div className="card divide-y divide-line p-0 opacity-70">{inactive.map((c) => <ClientRow key={c.id} c={c} />)}</div>
        </>
      )}
    </>
  );
}
