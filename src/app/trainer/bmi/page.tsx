import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireTrainer } from "@/lib/dal";
import { getProfile } from "@/lib/q-client";
import { BmiCalculator } from "@/components/bmi-calculator";
import { IconBack } from "@/components/icons";

export default async function TrainerBmi(props: PageProps<"/trainer/bmi">) {
  await requireTrainer();
  const id = String((await props.searchParams).client ?? "");
  const client = id ? await db.query.users.findFirst({ where: and(eq(users.id, id), eq(users.role, "client")) }) : null;
  const profile = client ? await getProfile(client.id) : null;
  return (
    <>
      <Link href={client ? `/trainer/clients/${client.id}?tab=body` : "/trainer/more"} className="-ml-1 mb-3 inline-flex items-center text-sm text-muted"><IconBack className="size-4" />{client?.name ?? "More"}</Link>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">BMI calculator</h1>
      {client && <p className="-mt-2 mb-3 text-sm text-muted">Filled in from {client.name.split(" ")[0]}&apos;s latest assessment and weigh-in.</p>}
      <BmiCalculator initial={profile ?? undefined} />
    </>
  );
}
