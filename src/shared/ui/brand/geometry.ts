/**
 * ScopeLock mark — "Focus Lock".
 *
 * Two corner brackets frame a solid core, the way a camera locks focus on a
 * subject. The brackets are the agreed scope; the green core is the work
 * inside it, locked in.
 *
 * Single source of truth for the logo, the loader and the generated app icons.
 * All coordinates live in a 48×48 viewBox.
 */
export const MARK_VIEWBOX = "0 0 48 48";
export const MARK_STROKE = 5;

export const markPaths = {
  /** top-left focus bracket */
  bracketTopLeft: "M8.5 21V12.5a4 4 0 0 1 4-4H21",
  /** bottom-right focus bracket */
  bracketBottomRight: "M39.5 27v8.5a4 4 0 0 1-4 4H27",
} as const;

/** the locked core */
export const markCore = { x: 18, y: 18, width: 12, height: 12, rx: 3 } as const;

export const brandColors = {
  /** Emerald for light surfaces — "approved", money recovered */
  brand: "#0E9F6E",
  /** Brighter emerald for dark surfaces and the app icon */
  brandBright: "#34D399",
  /** Deep ink navy — trust, contracts */
  ink: "#0B1220",
  /** Bracket colour on the dark app-icon tile */
  tileFrame: "#F2F5F8",
  paper: "#FFFFFF",
} as const;
