export function num(v: FormDataEntryValue | null, min: number, max: number) {
  if (v === null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

// Photos are compressed in the browser to ~100KB JPEG data URLs.
export function checkPhoto(p: string) {
  return p.startsWith("data:image/jpeg;base64,") && p.length < 600_000;
}

export function normalizePhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  return d.length === 12 && d.startsWith("91") ? d.slice(2) : d;
}

// Accepts "90", "1:30", "1:02:00", "45s", "20m", "1m 30s". Returns seconds.
export function parseDuration(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return null;
  let sec: number;
  if (/^\d+(:\d{1,2}){1,2}$/.test(s)) sec = s.split(":").reduce((acc, p) => acc * 60 + Number(p), 0);
  else if (/^\d+$/.test(s)) sec = Number(s);
  else {
    const m = s.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m(?:in)?)?\s*(?:(\d+)\s*s(?:ec)?)?$/);
    if (!m || !(m[1] || m[2] || m[3])) return null;
    sec = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  }
  return sec > 0 && sec <= 6 * 3600 ? sec : null;
}
