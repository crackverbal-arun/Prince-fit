import Link from "next/link";
import { requireClient } from "@/lib/dal";
import { getProfile } from "@/lib/q-client";
import { BmiCalculator } from "@/components/bmi-calculator";
import { IconBack } from "@/components/icons";

export default async function MyBmi() {
  const me = await requireClient();
  return (
    <>
      <Link href="/me/progress?view=body" className="-ml-1 mb-3 inline-flex items-center text-sm text-muted"><IconBack className="size-4" />Body</Link>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">BMI calculator</h1>
      <BmiCalculator initial={await getProfile(me.id)} />
    </>
  );
}
