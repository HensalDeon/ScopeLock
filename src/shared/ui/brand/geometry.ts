/**
 * ScopeLock mark geometry — the single source of truth for the logo, the
 * loader and the generated app icons.
 *
 * Concept: two square brackets `[ ]` (= scope) form the body of a padlock,
 * topped by a shackle, with a keyhole inside. "Your scope, locked."
 *
 * All coordinates live in a 48×48 viewBox.
 */
export const MARK_VIEWBOX = "0 0 48 48";
export const MARK_STROKE = 3.6;

export const markPaths = {
  /** `[` — left half of the lock body */
  bracketLeft: "M17 21H10.5V41H18.5",
  /** `]` — right half of the lock body */
  bracketRight: "M31 21H37.5V41H29.5",
  /** padlock shackle, its legs land on the brackets' top arms */
  shackle: "M17 21V14.5a7 7 0 0 1 14 0V21",
  /** keyhole: round head + tapered stem */
  keyhole:
    "M24 25.2a3.3 3.3 0 0 1 1.65 6.16l.75 4.14a.9.9 0 0 1-.89 1.06h-3.02a.9.9 0 0 1-.89-1.06l.75-4.14A3.3 3.3 0 0 1 24 25.2Z",
} as const;

export const brandColors = {
  /** Emerald — "approved", money recovered */
  brand: "#10B981",
  /** Deep ink navy — trust, contracts */
  ink: "#0B1220",
  paper: "#FFFFFF",
} as const;
