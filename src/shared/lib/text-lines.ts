import { z } from "zod";

/** "One per line" text ⇄ a clean list: trimmed, blank lines and bullets dropped. */
export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-•*]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
}

export function joinLines(lines: readonly string[]): string {
  return lines.join("\n");
}

/** A textarea field holding a list, one item per line. */
export function linesField({
  maxItems,
  maxLength,
  label,
}: {
  maxItems: number;
  maxLength: number;
  label: string;
}) {
  return z
    .string()
    .transform(splitLines)
    .pipe(
      z
        .array(
          z
            .string()
            .max(
              maxLength,
              `Keep each ${label} under ${maxLength} characters.`,
            ),
        )
        .max(maxItems, `Up to ${maxItems} ${label}s.`),
    );
}
