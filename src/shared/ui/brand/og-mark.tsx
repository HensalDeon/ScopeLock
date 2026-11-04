import { brandColors, MARK_STROKE, MARK_VIEWBOX, markPaths } from "./geometry";

/**
 * The ScopeLock mark for `next/og` ImageResponse (app icons, favicon,
 * social images). Inline styles only — Tailwind isn't available there.
 *
 * @param glyphScale  share of the canvas the mark fills (maskable icons need more padding)
 * @param rounded     rounded-square tile (false for full-bleed maskable / iOS icons)
 */
export function OgMark({
  size,
  glyphScale = 0.7,
  rounded = true,
}: {
  size: number;
  glyphScale?: number;
  rounded?: boolean;
}) {
  const glyph = Math.round(size * glyphScale);
  // Thicker strokes at favicon sizes so the mark stays crisp.
  const stroke = size <= 48 ? MARK_STROKE * 1.25 : MARK_STROKE;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: brandColors.ink,
        borderRadius: rounded ? Math.round(size * 0.23) : 0,
      }}
    >
      <svg width={glyph} height={glyph} viewBox={MARK_VIEWBOX}>
        <path
          d={markPaths.shackle}
          fill="none"
          stroke={brandColors.brand}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={markPaths.bracketLeft}
          fill="none"
          stroke={brandColors.brand}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={markPaths.bracketRight}
          fill="none"
          stroke={brandColors.brand}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d={markPaths.keyhole} fill={brandColors.brand} />
      </svg>
    </div>
  );
}
