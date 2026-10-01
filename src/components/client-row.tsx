import Link from "next/link";
import type { ClientSummary } from "@/lib/queries";
import { nudgeText, waLink } from "@/lib/whatsapp";
import { Avatar, Chip, flagTone } from "./ui";
import { IconChevron, IconWhatsApp } from "./icons";

export function ClientRow({ c, nudge = false }: { c: ClientSummary; nudge?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Link href={`/trainer/clients/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={c.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{c.name}</span>
            {c.inToday && <Chip tone="volt">In today</Chip>}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {c.flags.length ? c.flags.map((f) => <Chip key={f.kind} tone={flagTone(f.kind)}>{f.label}</Chip>)
              : <span className="text-xs text-muted">{c.current ? `${c.current.left} sessions left` : "All good"} · {c.visits30} visits / 30d</span>}
          </div>
        </div>
        {!nudge && <IconChevron className="size-4 shrink-0 text-muted" />}
      </Link>
      {nudge && (
        <a href={waLink(c.phone, nudgeText(c.name, c.flags))} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${c.name}`}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-[#25D366] text-white">
          <IconWhatsApp className="size-5" />
        </a>
      )}
    </div>
  );
}
