/** Public, non-secret app identity. Safe to import anywhere. */
export const site = {
  name: "ScopeLock",
  tagline: "Stop doing extra work for free.",
  description:
    "Lock the original scope, turn every extra client request into an approved, paid change order.",
  url: process.env.APP_URL ?? "http://localhost:3000",
  // Keep in sync with src/shared/ui/brand/geometry.ts and globals.css (--brand, --brand-ink).
  colors: {
    brand: "#0E9F6E",
    ink: "#0B1220",
    background: "#FFFFFF",
  },
} as const;
