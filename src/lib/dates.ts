// All "days" are in IST so a 6am check-in in Mumbai lands on the right date.
const TZ = "Asia/Kolkata";

export function todayISO(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000);
}

export function dayOfWeek(iso: string) {
  return new Date(iso + "T00:00:00Z").getUTCDay();
}

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function rupees(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h) return `${h}h${m ? ` ${m}m` : ""}`;
  return `${m}m${s ? ` ${s}s` : ""}`;
}

// "1:30" style, for pre-filling inputs
export function clockDuration(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const ABSENCE_REASONS = ["Sick", "Travel", "Work", "Family", "Injury", "Other"];
