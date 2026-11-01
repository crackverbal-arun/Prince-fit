import "server-only";

// Automatic sending through the official WhatsApp Business Cloud API (Meta).
// Business-initiated messages must use templates that Meta has approved; see README for the exact wording.
// When these env vars are missing, the app falls back to one-tap wa.me links that Prince sends himself.
export function whatsappConfigured() {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export function toWaNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
}

/** Sends an approved template. `params` fill {{1}}, {{2}}… in the template body, in order. */
export async function sendTemplate(phone: string, template: string, params: string[]): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!whatsappConfigured()) return { ok: false, error: "WhatsApp API not configured" };
  const base = process.env.WHATSAPP_API_BASE ?? "https://graph.facebook.com/v21.0";
  try {
    const res = await fetch(`${base}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp", to: toWaNumber(phone), type: "template",
        template: { name: template, language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "en" }, components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }] },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { ok: true };
    const body = await res.text();
    return { ok: false, error: `${res.status}: ${body.slice(0, 300)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export const TEMPLATES = {
  reminder: () => process.env.WHATSAPP_TEMPLATE_REMINDER ?? "session_reminder", // {{1}} name, {{2}} day + date, {{3}} time
  update: () => process.env.WHATSAPP_TEMPLATE_UPDATE ?? "session_update", // {{1}} name, {{2}} what changed
};
