import { dueReminders, sendReminders } from "@/lib/reminders";
import { whatsappConfigured } from "@/lib/whatsapp-api";

// Called by Vercel Cron every evening (see vercel.json) — or any external cron — to send
// WhatsApp reminders for tomorrow's sessions. ?day=today sends same-day reminders instead.
// Protected by CRON_SECRET: Vercel sends it as "Authorization: Bearer <secret>".
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? url.searchParams.get("key");
  if (!secret || given !== secret) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!whatsappConfigured()) return Response.json({ error: "WhatsApp API not configured", sent: 0 }, { status: 200 });

  const day = url.searchParams.get("day") === "today" ? "today" : "tomorrow";
  const result = await sendReminders(await dueReminders(day), day === "today" ? "today" : "tomorrow");
  return Response.json({ day, ...result });
}
