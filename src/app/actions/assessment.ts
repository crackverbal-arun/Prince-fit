"use server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, assessments, bodyStats, settings, users } from "@/db";
import { requireTrainer } from "@/lib/dal";
import { sectionsOf, validateSections, type AssessmentData, type Field, type Section } from "@/lib/assessment";
import { getTemplate } from "@/lib/q-assessment";
import { num, parseDuration } from "@/lib/validate";
import { todayISO } from "@/lib/dates";

function parse(formData: FormData, fields: Field[]): AssessmentData {
  const data: AssessmentData = {};
  for (const f of fields) {
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
  // Editing keeps the form the assessment was taken with; a new one uses the client's current template.
  const existing = assessmentId ? await db.query.assessments.findFirst({ where: and(eq(assessments.id, assessmentId), eq(assessments.clientId, clientId)) }) : null;
  const sections: Section[] = existing ? sectionsOf(existing) : (await getTemplate(clientId)).sections;
  const data = parse(formData, sections.flatMap((x) => x.fields));
  let savedId = assessmentId;

  if (existing) {
    await db.update(assessments).set({ date, kind, data, fields: sections }).where(eq(assessments.id, existing.id));
  } else {
    const [row] = await db.insert(assessments).values({ clientId, date, kind, data, fields: sections }).returning({ id: assessments.id });
    savedId = row.id;
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
  redirect(`/trainer/clients/${clientId}?tab=assessment&a=${savedId}&done=1`);
}

export async function deleteAssessment(clientId: string, assessmentId: string) {
  await requireTrainer();
  await db.delete(assessments).where(and(eq(assessments.id, assessmentId), eq(assessments.clientId, clientId)));
  revalidatePath("/trainer", "layout");
  redirect(`/trainer/clients/${clientId}?tab=assessment`);
}

/** Save the assessment form for one client (clientId) or the default for everyone (null). */
export async function saveTemplate(clientId: string | null, json: string): Promise<{ error?: string; ok?: string }> {
  await requireTrainer();
  let parsed: unknown;
  try { parsed = JSON.parse(json); } catch { return { error: "Couldn't read the template." }; }
  const sections = validateSections(parsed);
  if (!sections) return { error: "Every test needs a name, and choice tests need at least 2 options." };
  if (clientId) await db.update(users).set({ assessmentTemplate: sections }).where(and(eq(users.id, clientId), eq(users.role, "client")));
  else await db.insert(settings).values({ key: "assessment_template", value: sections }).onConflictDoUpdate({ target: settings.key, set: { value: sections } });
  revalidatePath("/trainer", "layout");
  return { ok: clientId ? "Saved for this client" : "Saved as the default for all clients" };
}

/** Drop a client's custom form so they follow the default again. */
export async function resetTemplate(clientId: string) {
  await requireTrainer();
  await db.update(users).set({ assessmentTemplate: null }).where(eq(users.id, clientId));
  revalidatePath("/trainer", "layout");
}
