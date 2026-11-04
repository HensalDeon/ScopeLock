import { cn } from "@/shared/lib/utils";

const FILLER = new Set(["and", "of", "the", "for", "&"]);

/** "Pixel & Code Studio" → "PC". Used until a logo is uploaded. */
export function initialsOf(name: string): string {
  const all = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = all.filter((w) => !FILLER.has(w.toLowerCase()));
  const words = meaningful.length ? meaningful : all;
  if (words.length === 0) return "–";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

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
