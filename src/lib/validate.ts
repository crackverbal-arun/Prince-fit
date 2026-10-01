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
