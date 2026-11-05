const FILLER = new Set(["and", "of", "the", "for", "&"]);

/**
 * Two-letter initials for a person or business, used until a logo or photo
 * exists. Skips filler words: "Pixel & Code Studio" → "PC", "Asha Rao" → "AR".
 */
export function initialsOf(name: string): string {
  const all = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = all.filter((word) => !FILLER.has(word.toLowerCase()));
  const [first, second] = meaningful.length ? meaningful : all;
  if (!first) return "–";
  if (!second) return first.slice(0, 2).toUpperCase();
  return (first.charAt(0) + second.charAt(0)).toUpperCase();
}
