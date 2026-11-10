/** Public, non-secret app identity. Safe to import anywhere. */
export const site = {
  name: "ScopeLock",
  tagline: "Stop doing extra work for free.",
  description:
    "ScopeLock records what your client agreed to, turns every extra request into a priced change request, and gets it approved before you start. Built for freelancers, studios and agencies in India.",
  /** Set APP_URL once the domain is bought; everything (metadata, sitemap, emails) follows. */
  url: process.env.APP_URL ?? "http://localhost:3000",
  // Keep in sync with src/shared/ui/brand/geometry.ts and globals.css (--brand, --brand-ink).
  colors: {
    brand: "#0E9F6E",
    ink: "#0B1220",
    background: "#FFFFFF",
  },
} as const;

/**
 * The registered business behind ScopeLock. Used by Terms, Privacy, Refunds,
 * Contact and the footer.
 *
 * TODO before launch: replace every [bracketed] value with the real details.
 */
export const legal = {
  businessName: "[Registered business name]",
  businessType: "[Private Limited / LLP / Proprietorship]",
  address: "[Registered office address, City, State, PIN]",
  city: "[City]",
  state: "[State]",
  email: "[support@yourdomain.com]",
  phone: "[+91 XXXXX XXXXX]",
  supportHours: "[Monday to Friday, 10 am to 6 pm IST]",
  gstin: "[GSTIN, if registered]",
  grievanceOfficer: {
    name: "[Grievance Officer name]",
    email: "[grievance@yourdomain.com]",
  },
  lastUpdated: "4 November 2026",
  copyrightYear: 2026,
} as const;

/** A `legal` value not filled in yet ("[City]"): never shown on the site. */
export function isPlaceholder(value: string): boolean {
  return value.startsWith("[");
}
