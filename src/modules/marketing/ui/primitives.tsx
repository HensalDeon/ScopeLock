import { cn } from "@/shared/lib/utils";

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

/** Small mono label above a section heading. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[11.5px] tracking-[0.14em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  className,
  invert = false,
  as: Heading = "h2",
}: {
  /** "h1" when it opens its own page (pricing, contact). */
  as?: "h1" | "h2";
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  className?: string;
  invert?: boolean;
}) {
  return (
    <div className={cn("grid max-w-2xl gap-4", className)}>
      {eyebrow && (
        <Eyebrow className={invert ? "text-[#8b95a7]" : undefined}>
          {eyebrow}
        </Eyebrow>
      )}
      <Heading
        className={cn(
          "text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-[42px]",
          invert && "text-white",
        )}
      >
        {title}
      </Heading>
      {intro && (
        <p
          className={cn(
            "max-w-[60ch] text-[17px] leading-relaxed text-pretty",
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
