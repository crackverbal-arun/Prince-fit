// Session times are local IST "HH:MM". Shared by client and server code.
export function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function endTime(t: string, minutes: number) {
  const [h, m] = t.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function longDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

export const isTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

type S = { date: string; startTime: string; title?: string | null };
const first = (name: string) => name.split(" ")[0];
const what = (s: S) => (s.title ? `${s.title} session` : "training session");

export function reminderText(name: string, s: S, relative: string) {
  return `Hi ${first(name)}! 👋 Reminder: your ${what(s)} with Prince is ${relative} (${longDate(s.date)}) at ${fmtTime(s.startTime)}. See you there 💪`;
}
export function rescheduleText(name: string, from: S, to: S) {
  return `Hi ${first(name)}, your ${what(to)} has moved from ${longDate(from.date)} ${fmtTime(from.startTime)} to ${longDate(to.date)} at ${fmtTime(to.startTime)}. Reply here if that doesn't work for you. — Prince`;
}
export function cancelText(name: string, s: S, reason?: string | null) {
  return `Hi ${first(name)}, your ${what(s)} on ${longDate(s.date)} at ${fmtTime(s.startTime)} is cancelled${reason ? ` (${reason})` : ""}. I'll share a new slot soon. — Prince`;
}
