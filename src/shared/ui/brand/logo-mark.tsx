import { cn } from "@/shared/lib/utils";
import { MARK_STROKE, MARK_VIEWBOX, markPaths } from "./geometry";

type LogoMarkProps = {
  /**
   * `tile`  — emerald mark on an ink rounded square (app-icon style, default)
   * `plain` — the mark alone, coloured by `currentColor` / `text-*`
   */
  variant?: "tile" | "plain";
  className?: string;
  title?: string;
};

export function LogoMark({
  variant = "tile",
  className,
  title = "ScopeLock",
}: LogoMarkProps) {
  const glyph = (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={MARK_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={markPaths.shackle} />
      <path d={markPaths.bracketLeft} />
      <path d={markPaths.bracketRight} />
      <path d={markPaths.keyhole} fill="currentColor" stroke="none" />
    </g>
  );

  if (variant === "plain") {
    return (
      <svg
        viewBox={MARK_VIEWBOX}
        role="img"
        aria-label={title}
        className={cn("size-8", className)}
      >
        {glyph}
      </svg>
    );
  }

  return (
    <svg
      viewBox={MARK_VIEWBOX}
      role="img"
      aria-label={title}
      className={cn("size-8 shrink-0", className)}
    >
      <rect width="48" height="48" rx="11" className="fill-brand-ink" />
      <g className="text-brand" transform="translate(2.4 2.4) scale(0.9)">
        {glyph}
      </g>
    </svg>
  );
}
