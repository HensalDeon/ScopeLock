import { cn } from "@/shared/lib/utils";
import { MARK_STROKE, MARK_VIEWBOX, markCore, markPaths } from "./geometry";

/**
 * Animated ScopeLock loader — "focus lock":
 * the brackets snap inward and the core lands, like a camera confirming focus.
 * Pure SVG + CSS (keyframes in globals.css), no JS. Respects reduced motion.
 */
export function BrandLoader({
  size = "md",
  label = "Loading",
  showLabel = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex flex-col items-center gap-3", className)}
    >
      <svg
        viewBox={MARK_VIEWBOX}
        aria-hidden
        className={cn(
          "sl-loader text-foreground",
          size === "sm" && "size-5",
          size === "md" && "size-10",
          size === "lg" && "size-14",
        )}
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={MARK_STROKE}
          strokeLinejoin="round"
        >
          <path className="sl-loader-tl" d={markPaths.bracketTopLeft} />
          <path className="sl-loader-br" d={markPaths.bracketBottomRight} />
        </g>
        <rect {...markCore} className="sl-loader-core fill-brand" />
      </svg>
      <span
        className={cn(
          showLabel ? "text-sm font-medium text-muted-foreground" : "sr-only",
        )}
      >
        {label}
        {showLabel && <span className="sl-loader-dots" aria-hidden />}
      </span>
    </div>
  );
}

/** Full-screen centred loader, for route-level `loading.tsx`. */
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center p-8">
      <BrandLoader size="lg" label={label} showLabel />
    </div>
  );
}
