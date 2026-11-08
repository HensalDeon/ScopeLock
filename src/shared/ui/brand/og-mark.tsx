import {
  brandColors,
  MARK_STROKE,
  MARK_VIEWBOX,
  markCore,
  markPaths,
} from "./geometry";

/**
 * The ScopeLock app-icon tile for `next/og` ImageResponse (favicon, PWA icons,
 * iOS icon, social images). Inline styles only — Tailwind isn't available there.
 *
 * @param glyphScale  share of the canvas the mark fills (maskable icons need more padding)
 * @param rounded     rounded-square tile (false for full-bleed maskable / iOS icons)
 */
export function OgMark({
  size,
  glyphScale = 0.68,
  rounded = true,
}: {
  size: number;
  glyphScale?: number;
  rounded?: boolean;
}) {
  const glyph = Math.round(size * glyphScale);
  // Slightly heavier brackets at favicon sizes so the mark stays crisp.
  const stroke = size <= 48 ? MARK_STROKE * 1.12 : MARK_STROKE;

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
          d={markPaths.bracketTopLeft}
          fill="none"
          stroke={brandColors.tileFrame}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
        <path
          d={markPaths.bracketBottomRight}
          fill="none"
          stroke={brandColors.tileFrame}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
        <rect {...markCore} fill={brandColors.brandBright} />
      </svg>
    </div>
  );
}

/**
 * The bare mark for light backgrounds (emails): ink brackets, emerald core,
 * transparent canvas. Rendered to PNG because email clients drop inline SVG.
 */
export function OgMarkOnLight({ size }: { size: number }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      <svg width={size} height={size} viewBox={MARK_VIEWBOX}>
        <path
          d={markPaths.bracketTopLeft}
          fill="none"
          stroke={brandColors.ink}
          strokeWidth={MARK_STROKE}
          strokeLinejoin="round"
        />
        <path
          d={markPaths.bracketBottomRight}
          fill="none"
          stroke={brandColors.ink}
          strokeWidth={MARK_STROKE}
          strokeLinejoin="round"
        />
        <rect {...markCore} fill={brandColors.brand} />
      </svg>
    </div>
  );
}
