import { BottomNav } from "@/components/bottom-nav";
import { IconCalendar, IconGrid, IconHome, IconUsers } from "@/components/icons";

export default function TrainerLayout({ children }: LayoutProps<"/trainer">) {
  return (
    <>
      <main className="mx-auto max-w-md px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">{children}</main>
      <BottomNav
        items={[
          { href: "/trainer", label: "Home", icon: <IconHome className="size-5" />, exact: true },
          { href: "/trainer/schedule", label: "Schedule", icon: <IconCalendar className="size-5" /> },
          { href: "/trainer/clients", label: "Clients", icon: <IconUsers className="size-5" /> },
          { href: "/trainer/more", label: "More", icon: <IconGrid className="size-5" /> },
        ]}
      />
    </>
  );
}
