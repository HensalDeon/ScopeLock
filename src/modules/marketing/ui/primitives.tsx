import { cn } from "@/shared/lib/utils";

/**
 * The marketing display face (DESIGN.md marketing-display): Anek Latin,
 * semi-condensed. Headlines only; body, figures and the app stay in Geist.
 */
export const DISPLAY =
  "font-display [font-stretch:87.5%] tracking-[-0.01em] text-balance";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

/**
 * A section's heading, with its intro beside it on wide screens (as in the
 * hero): the heading carries the section, no label above it.
 */
export function SectionHeading({
  title,
  intro,
  className,
  invert = false,
  as: Heading = "h2",
}: {
  /** "h1" when it opens its own page (pricing, contact). */
  as?: "h1" | "h2";
  title: React.ReactNode;
  intro?: React.ReactNode;
  className?: string;
  invert?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        intro && "lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-end lg:gap-16",
        className,
      )}
    >
      <Heading
        className={cn(
          DISPLAY,
          "max-w-[20ch] text-[36px] leading-[1] font-semibold sm:text-[50px]",
          invert && "text-white",
        )}
      >
        {title}
      </Heading>
      {intro && (
        <p
          className={cn(
            "max-w-[60ch] text-[17px] leading-relaxed text-pretty lg:pb-1",
            invert ? "text-[#a3adbd]" : "text-muted-foreground",
          )}
        >
          {intro}
        </p>
      )}
    </div>
  );
}

/** Dotted leader between a label and an amount, like a printed bill. */
export function Leader() {
  return (
    <span
      aria-hidden
      className="mx-2 mb-[0.32em] min-w-6 flex-1 self-end border-b border-dotted border-current opacity-30"
    />
  );
}
