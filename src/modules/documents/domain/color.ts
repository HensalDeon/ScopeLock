/**
 * Colour maths for documents (WCAG 2.x contrast). Pure, so the template can
 * guarantee readable text whatever accent colour a freelancer picks.
 */

export type Hex = `#${string}`;

const HEX = /^#[0-9a-f]{6}$/i;

export function isHex(value: string): value is Hex {
  return HEX.test(value);
}

function toRgb(hex: Hex): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): Hex {
  return `#${[r, g, b]
    .map((c) =>
      Math.round(Math.min(255, Math.max(0, c)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}` as Hex;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: Hex): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colours, 1 to 21. */
export function contrast(a: Hex, b: Hex): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

/** Blend `color` towards `target` by `amount` (0 = color, 1 = target). */
export function mix(color: Hex, target: Hex, amount: number): Hex {
  const [r1, g1, b1] = toRgb(color);
  const [r2, g2, b2] = toRgb(target);
  return toHex([
    r1 + (r2 - r1) * amount,
    g1 + (g2 - g1) * amount,
    b1 + (b2 - b1) * amount,
  ]);
}

/**
 * The closest shade of `color` that reaches `min` contrast on `background`:
 * darkened on light backgrounds, lightened on dark ones. Returns the colour
 * unchanged when it already passes.
 */
export function readableShade(color: Hex, background: Hex, min = 4.5): Hex {
  if (contrast(color, background) >= min) return color;
  const target: Hex = luminance(background) > 0.5 ? "#000000" : "#ffffff";
  for (let step = 1; step <= 20; step++) {
    const shade = mix(color, target, step / 20);
    if (contrast(shade, background) >= min) return shade;
  }
  return target;
}

/** Black-ish or white text, whichever reads better on `background`. */
export function textOn(background: Hex, dark: Hex = "#111318"): Hex {
  return contrast(dark, background) >= contrast("#ffffff", background)
    ? dark
    : "#ffffff";
}
