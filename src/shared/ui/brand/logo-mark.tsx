import { cn } from "@/shared/lib/utils";
import { MARK_STROKE, MARK_VIEWBOX, markCore, markPaths } from "./geometry";

type LogoMarkProps = {
  /**
   * `plain` — brackets in the current text colour, core in brand green (default)
   * `tile`  — app-icon style: light brackets + bright core on an ink rounded square
   */
  variant?: "plain" | "tile";
  className?: string;
  /** Accessible name. Pass "" when the mark sits next to the wordmark. */
  title?: string;
};

function Glyph({ coreClassName }: { coreClassName: string }) {
  return (
    <>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={MARK_STROKE}
        strokeLinejoin="round"
      >
        <path d={markPaths.bracketTopLeft} />
        <path d={markPaths.bracketBottomRight} />
      </g>
      <rect {...markCore} className={coreClassName} />
    </>
  );
}

export function LogoMark({
  variant = "plain",
  className,
  title = "ScopeLock",
}: LogoMarkProps) {
  const a11y = title
    ? ({ role: "img", "aria-label": title } as const)
    : ({ "aria-hidden": true } as const);

  if (variant === "tile") {
    return (
      <svg
        viewBox={MARK_VIEWBOX}
        {...a11y}
        className={cn("size-8 shrink-0", className)}
      >
        <rect width="48" height="48" rx="11" className="fill-brand-ink" />
        <g
          className="text-brand-tile-frame"
          transform="translate(7.68 7.68) scale(0.68)"
        >
          <Glyph coreClassName="fill-brand-bright" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox={MARK_VIEWBOX}
      {...a11y}
      className={cn("size-8 shrink-0 text-foreground", className)}
    >
      <Glyph coreClassName="fill-brand" />
    </svg>
  );
}
