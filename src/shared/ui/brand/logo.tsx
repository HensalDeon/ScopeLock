import { cn } from "@/shared/lib/utils";
import { LogoMark } from "./logo-mark";

/** Mark + "ScopeLock" wordmark. */
export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <LogoMark className={cn("size-8", markClassName)} title="" />
      <span>
        Scope<span className="text-brand">Lock</span>
      </span>
    </span>
  );
}
