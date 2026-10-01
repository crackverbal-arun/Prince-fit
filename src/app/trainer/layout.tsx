import { BottomNav } from "@/components/bottom-nav";
import { IconHome, IconPlus, IconUsers } from "@/components/icons";

export default function TrainerLayout({ children }: LayoutProps<"/trainer">) {
  return (
    <>
      <main className="mx-auto max-w-md px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">{children}</main>
      <BottomNav
        items={[
          { href: "/trainer", label: "Home", icon: <IconHome className="size-5" />, exact: true },
          { href: "/trainer/clients", label: "Clients", icon: <IconUsers className="size-5" /> },
          { href: "/trainer/new", label: "Add client", icon: <IconPlus className="size-5" /> },
        ]}
      />
    </>
  );
}
