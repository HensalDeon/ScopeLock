import { initialsOf } from "@/shared/lib/initials";
import { cn } from "@/shared/lib/utils";

export function BusinessInitials({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-ink text-[13px] font-semibold tracking-wide text-white",
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
