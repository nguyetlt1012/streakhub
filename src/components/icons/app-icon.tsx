import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const ICONS = {
  "home-fill": "mingcute:home-5-fill",
  "home-line": "mingcute:home-5-line",
  "protocol-fill": "mingcute:task-2-fill",
  "protocol-line": "mingcute:task-2-line",
  "tasks-fill": "mingcute:task-2-fill",
  "tasks-line": "mingcute:task-2-line",
  "fire-fill": "mingcute:fire-fill",
  "fire-line": "mingcute:fire-line",
  "chart-fill": "mingcute:chart-bar-fill",
  "chart-line": "mingcute:chart-bar-line",
  user: "mingcute:user-3-line",
  check: "mingcute:check-fill",
  edit: "mingcute:edit-line",
  delete: "mingcute:delete-2-line",
  search: "mingcute:search-line",
  add: "mingcute:add-fill",
  left: "mingcute:left-line",
  right: "mingcute:right-line",
  download: "mingcute:download-2-line",
  lock: "mingcute:lock-line",
  close: "mingcute:close-line",
  fire: "mingcute:fire-fill",
} as const;

export type AppIconName = keyof typeof ICONS;

type AppIconProps = {
  name: AppIconName;
  className?: string;
};

export function AppIcon({ name, className }: AppIconProps) {
  return (
    <Icon
      icon={ICONS[name]}
      className={cn("inline-block shrink-0", className)}
    />
  );
}
