import { getPackages } from "@/lib/queries";
import { todayISO, addDays } from "@/lib/dates";
import { addPackage, recordPayment } from "@/app/actions/trainer";
import { PackageCard } from "@/components/package-card";
import { Submit } from "@/components/submit";
import { Empty } from "@/components/ui";

export async function PackageTab({ clientId }: { clientId: string }) {
  const { current, others: past } = await getPackages(clientId);
  const today = todayISO();
  const nextStart = current && !current.expired && current.pkg.endDate >= today ? addDays(current.pkg.endDate, 1) : today;

  return (
    <div className="space-y-3">
      {current ? (
        <PackageCard s={current}>
          {current.due > 0 && (
            <form action={recordPayment.bind(null, clientId, current.pkg.id)} className="mt-3 flex gap-2">
              <input name="amount" type="number" inputMode="numeric" placeholder="Amount received (₹)" defaultValue={current.due} className="input min-w-0 flex-1" />
              <Submit className="btn-primary shrink-0">Record</Submit>
            </form>
          )}
        </PackageCard>
      ) : <Empty>No package yet.</Empty>}

      <form action={addPackage.bind(null, clientId)} className="card space-y-2">
        <div className="text-sm font-semibold">{current ? "Renew / new package" : "Add package"}</div>
        <input name="name" placeholder="e.g. 12 sessions / month" className="input" />
        <div className="grid grid-cols-2 gap-2">
          <label><span className="label">Sessions</span><input name="sessions" type="number" inputMode="numeric" defaultValue={current?.pkg.totalSessions ?? 12} required className="input" /></label>
          <label><span className="label">Price (₹)</span><input name="amount" type="number" inputMode="numeric" defaultValue={current?.pkg.amount} required className="input" /></label>
          <label><span className="label">Starts</span><input name="start" type="date" defaultValue={nextStart} required className="input" /></label>
          <label><span className="label">Ends</span><input name="end" type="date" defaultValue={addDays(nextStart, 30)} required className="input" /></label>
          <label className="col-span-2"><span className="label">Paid now (₹)</span><input name="paid" type="number" inputMode="numeric" defaultValue={0} className="input" /></label>
        </div>
        <Submit>Save package</Submit>
      </form>

      {past.length > 0 && (
        <>
          <h2 className="h-section">Other packages</h2>
          {past.map((s) => (
            <PackageCard key={s.pkg.id} s={s}>
              {s.due > 0 && (
                <form action={recordPayment.bind(null, clientId, s.pkg.id)} className="mt-3 flex gap-2">
                  <input name="amount" type="number" inputMode="numeric" defaultValue={s.due} className="input min-w-0 flex-1" />
                  <Submit className="btn-primary shrink-0">Record</Submit>
                </form>
              )}
            </PackageCard>
          ))}
        </>
      )}
    </div>
  );
}
