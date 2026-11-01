import Link from "next/link";
import { requireTrainer } from "@/lib/dal";
import { whatsappConfigured } from "@/lib/whatsapp-api";
import { logout } from "@/app/actions/auth";
import { IconChevron } from "@/components/icons";

export default async function More() {
  const me = await requireTrainer();
  const auto = whatsappConfigured();
  const items = [
    ["/trainer/new", "Add client", "Create a login and send it on WhatsApp"],
    ["/trainer/bmi", "BMI calculator", "Male / female, with Asian-Indian categories"],
    ["/trainer/foods", "Food database", "Edit calories, macros and micronutrients"],
    ["/trainer/assessment-template", "Default assessment tests", "Edit, replace or add tests for everyone"],
  ];
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">More</h1>
      <div className="card divide-y divide-line p-0">
        {items.map(([href, title, sub]) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1"><div className="font-semibold">{title}</div><div className="text-xs text-muted">{sub}</div></div>
            <IconChevron className="size-4 text-muted" />
          </Link>
        ))}
      </div>
      <h2 className="h-section">WhatsApp reminders</h2>
      <div className="card text-sm">
        {auto ? (
          <><div className="font-semibold text-good">✓ Automatic sending is on</div><p className="mt-1 text-muted">Reminders for the next day go out every evening at 7 PM. Reschedule and cancel notices are sent instantly.</p></>
        ) : (
          <><div className="font-semibold">Manual mode: one-tap WhatsApp buttons</div><p className="mt-1 text-muted">Reminders, reschedules and cancellations open WhatsApp with the message ready to send. To send them automatically, connect the WhatsApp Business API (see the setup guide in the project README).</p></>
        )}
      </div>
      <h2 className="h-section">Account</h2>
      <div className="card space-y-2 text-sm">
        <div><span className="text-muted">Logged in as</span> {me.name} · {me.phone}</div>
        <form action={logout}><button className="btn-ghost w-full text-bad">Log out</button></form>
      </div>
    </>
  );
}
