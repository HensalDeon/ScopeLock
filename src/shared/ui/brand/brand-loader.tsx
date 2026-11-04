import { cn } from "@/shared/lib/utils";
import { MARK_STROKE, MARK_VIEWBOX, markPaths } from "./geometry";

/**
 * Animated ScopeLock loader — "scope locked":
 * the brackets close in, the shackle drops and clicks shut, the keyhole appears.
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
          "sl-loader text-brand",
          size === "sm" && "size-6",
          size === "md" && "size-12",
          size === "lg" && "size-20",
        )}
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={MARK_STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path className="sl-loader-shackle" d={markPaths.shackle} />
          <path className="sl-loader-left" d={markPaths.bracketLeft} />
          <path className="sl-loader-right" d={markPaths.bracketRight} />
          <path
            className="sl-loader-keyhole"
            d={markPaths.keyhole}
            fill="currentColor"
            stroke="none"
          />
        </g>
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
