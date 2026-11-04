import { cn } from "@/shared/lib/utils";
import { LogoMark } from "./logo-mark";

/** Focus Lock mark + lowercase "scopelock" wordmark. */
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
        "inline-flex items-center gap-2 text-xl font-semibold tracking-[-0.035em] text-foreground",
        className,
      )}
    >
      <LogoMark title="" className={cn("size-[1.3em]", markClassName)} />
      <span>scopelock</span>
      <span className="sr-only">ScopeLock</span>
    </span>
  );
}
