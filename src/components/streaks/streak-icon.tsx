import { ICON_PRESET_MAP } from "@/lib/streaks/constants";
import { cn } from "@/lib/utils";

type StreakIconProps = {
  iconType: "preset" | "upload";
  iconPreset?: string | null;
  avatarUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "size-8 text-sm",
  md: "size-10",
  lg: "size-14",
};

export function StreakIcon({
  iconType,
  iconPreset,
  avatarUrl,
  className,
  size = "md",
}: StreakIconProps) {
  const boxClass = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted",
    sizeClasses[size],
    className,
  );

  if (iconType === "upload" && avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt="" className={cn(boxClass, "object-cover")} />
    );
  }

  const preset = iconPreset ? ICON_PRESET_MAP[iconPreset] : null;
  const Icon = preset?.Icon;

  return (
    <div className={boxClass}>
      {Icon ? (
        <Icon className={size === "sm" ? "size-4" : size === "lg" ? "size-7" : "size-5"} />
      ) : (
        <span className="text-xs font-medium text-muted-foreground">?</span>
      )}
    </div>
  );
}
