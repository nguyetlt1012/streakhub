import { cn } from "@/lib/utils";

type TimePickerProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

export function TimePicker({
  id,
  name,
  value,
  onChange,
  className,
  disabled,
}: TimePickerProps) {
  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        name={name}
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full appearance-none rounded-md border border-border bg-input px-4 py-4",
          "text-center font-heading text-3xl uppercase tracking-wider text-foreground",
          "outline-none transition-colors focus:border-primary",
          "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0",
          "[&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full",
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
          "disabled:opacity-60",
        )}
      />
    </div>
  );
}

export function detectUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}
