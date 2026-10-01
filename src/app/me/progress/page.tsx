import { requireClient } from "@/lib/dal";
import { ProgressView } from "@/components/progress-view";
import { AddStatForm } from "./add-stat";

export default async function Progress() {
  const me = await requireClient();
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Progress</h1>
      {me.goal && <p className="mb-4 text-sm text-muted">Goal: {me.goal}</p>}
      <AddStatForm />
      <div className="mt-3"><ProgressView clientId={me.id} /></div>
    </>
  );
}
