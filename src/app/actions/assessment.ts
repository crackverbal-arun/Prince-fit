"use server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, assessments, bodyStats, users } from "@/db";
import { requireTrainer } from "@/lib/dal";
import { FIELDS, type AssessmentData } from "@/lib/assessment";
import { num, parseDuration } from "@/lib/validate";
import { todayISO } from "@/lib/dates";

function parse(formData: FormData): AssessmentData {
  const data: AssessmentData = {};
  for (const f of FIELDS) {
    const raw = formData.get(f.key);
    let v: AssessmentData[string] | null = null;
    switch (f.type) {
      case "number": v = num(raw, 0, 1_000_000); break;
      case "scale": v = num(raw, f.min, f.max); break;
      case "duration": v = parseDuration(raw); break;
      case "choice": v = f.options.includes(String(raw)) ? String(raw) : null; break;
      case "multi": v = formData.getAll(f.key).map(String).filter((o) => f.options.includes(o)); break;
      case "height": {
        const ft = num(formData.get("heightFt"), 3, 8), inch = num(formData.get("heightIn"), 0, 11.9) ?? 0;
        v = ft ? Math.round((ft * 12 + inch) * 2.54) : null;
        break;
      }
      default: v = String(raw ?? "").trim().slice(0, f.type === "textarea" ? 1000 : 200) || null;
    }
    if (v !== null && !(Array.isArray(v) && !v.length)) data[f.key] = v;
  }
  return data;
}

export async function saveAssessment(clientId: string, assessmentId: string | null, formData: FormData) {
  await requireTrainer();
  const client = await db.query.users.findFirst({ where: and(eq(users.id, clientId), eq(users.role, "client")) });
  if (!client) throw new Error("Client not found");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(formData.get("date"))) ? String(formData.get("date")) : todayISO();
  const kind = formData.get("kind") === "baseline" ? "baseline" : "review";
  const data = parse(formData);

  if (assessmentId) {
    await db.update(assessments).set({ date, kind, data }).where(and(eq(assessments.id, assessmentId), eq(assessments.clientId, clientId)));
  } else {
    await db.insert(assessments).values({ clientId, date, kind, data });
    // Feed weight/waist into the progress chart too.
    if (typeof data.weight === "number" || typeof data.waist === "number") {
      await db.insert(bodyStats).values({
        clientId, date,
        weightKg: typeof data.weight === "number" ? data.weight : null,
        waistCm: typeof data.waist === "number" ? data.waist : null,
      });
    }
  }
  revalidatePath("/trainer", "layout");
  revalidatePath("/me", "layout");
  redirect(`/trainer/clients/${clientId}?tab=assessment`);
}

export async function deleteAssessment(clientId: string, assessmentId: string) {
  await requireTrainer();
  await db.delete(assessments).where(and(eq(assessments.id, assessmentId), eq(assessments.clientId, clientId)));
  revalidatePath("/trainer", "layout");
  redirect(`/trainer/clients/${clientId}?tab=assessment`);
}
