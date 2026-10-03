// Click-to-chat links: open WhatsApp on Prince's phone with the message typed out.
export function waLink(phone: string, text: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function nudgeText(name: string, flags: { kind: string; label: string }[]) {
  const first = name.split(" ")[0];
  const kinds = new Set(flags.map((f) => f.kind));
  const lines = [`Hi ${first}! 👋`];
  if (kinds.has("missed")) lines.push("Haven't seen you at the gym for a few days — let's get back on track. What time works for your next session?");
  if (kinds.has("diet")) lines.push("Noticed your meal log was light yesterday. Tick off your meals in the app today, it really helps me adjust your plan.");
  if (kinds.has("renewal") || kinds.has("nopackage")) lines.push("Your package is about to run out. Shall I set up the next one so we don't lose momentum?");
  if (kinds.has("assessment")) lines.push("It's time for your fitness assessment, so we can measure how far you've come and plan the next 3 months. When can you do a 60–90 min slot?");
  if (kinds.has("dues")) {
    const due = flags.find((f) => f.kind === "dues")?.label.replace(" due", "");
    lines.push(`Gentle reminder: ${due} is pending on your package.`);
  }
  if (lines.length === 1) lines.push("Quick check-in — how's the training going?");
  lines.push("— Prince");
  return lines.join("\n\n");
}
