"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/dashboard",
    match: (path: string) => path === "/dashboard",
    iconActive: "home-fill" as const,
    iconInactive: "home-line" as const,
    label: "Home",
  },
  {
    href: "/streaks",
    match: (path: string) =>
      path === "/streaks" || path.startsWith("/streaks/"),
    iconActive: "fire-fill" as const,
    iconInactive: "fire-line" as const,
    label: "Protocol",
  },
  {
    href: "/tasks",
    match: (path: string) => path === "/tasks" || path.startsWith("/tasks/"),
    iconActive: "tasks-fill" as const,
    iconInactive: "tasks-line" as const,
    label: "Tasks",
  },
  {
    href: "/progress",
    match: (path: string) => path === "/progress",
    iconActive: "chart-fill" as const,
    iconInactive: "chart-line" as const,
    label: "Progress",
  },
  {
    href: "/settings",
    match: (path: string) => path === "/settings",
    iconActive: "user" as const,
    iconInactive: "user" as const,
    label: "Profile",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center justify-between border-t border-border bg-background/95 px-1 py-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center py-2 transition-colors active:scale-95",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
            aria-label={tab.label}
          >
            <AppIcon
              name={active ? tab.iconActive : tab.iconInactive}
              className="text-2xl sm:text-3xl"
            />
          </Link>
        );
      })}
    </nav>
  );
}
