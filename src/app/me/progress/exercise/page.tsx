import Link from "next/link";
import { requireClient } from "@/lib/dal";
import { ExerciseDetail } from "@/components/exercise-detail";
import { IconBack } from "@/components/icons";

export default async function MyExercise(props: PageProps<"/me/progress/exercise">) {
  const me = await requireClient();
  const name = String((await props.searchParams).name ?? "");
  return (
    <>
      <Link href="/me/progress" className="-ml-1 mb-3 inline-flex items-center text-sm text-muted"><IconBack className="size-4" />Progress</Link>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">{name}</h1>
      <ExerciseDetail clientId={me.id} name={name} />
    </>
  );
}
