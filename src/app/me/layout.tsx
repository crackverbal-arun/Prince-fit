import { BottomNav } from "@/components/bottom-nav";
import { IconChart, IconClipboard, IconHome } from "@/components/icons";

export default function ClientLayout({ children }: LayoutProps<"/me">) {
  return (
    <>
      <main className="mx-auto max-w-md px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">{children}</main>
      <BottomNav
        items={[
          { href: "/me", label: "Today", icon: <IconHome className="size-5" />, exact: true },
          { href: "/me/progress", label: "Progress", icon: <IconChart className="size-5" /> },
          { href: "/me/plan", label: "My plan", icon: <IconClipboard className="size-5" /> },
        ]}
      />
    </>
  );
}
