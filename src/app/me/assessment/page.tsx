import Link from "next/link";
import { requireClient } from "@/lib/dal";
import { getAssessments } from "@/lib/queries";
import { AssessmentReport } from "@/components/assessment-report";
import { IconBack } from "@/components/icons";

export default async function MyAssessment(props: PageProps<"/me/assessment">) {
  const me = await requireClient();
  const a = (await props.searchParams).a;
  return (
    <>
      <Link href="/me/plan" className="-ml-1 mb-3 inline-flex items-center text-sm text-muted"><IconBack className="size-4" />My plan</Link>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Fitness assessment</h1>
      <AssessmentReport list={await getAssessments(me.id)} selectedId={a ? String(a) : undefined} clientId={me.id} editable={false} />
    </>
  );
}
