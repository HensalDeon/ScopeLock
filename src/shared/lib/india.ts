/**
 * Indian states and union territories with their GST state codes (the first
 * two digits of a GSTIN), the GSTIN format, and the financial year.
 */
export const INDIAN_STATES = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
] as const;

export type StateCode = (typeof INDIAN_STATES)[number]["code"];

export const STATE_CODES = INDIAN_STATES.map((s) => s.code) as [
  StateCode,
  ...StateCode[],
];

export function stateName(code: string): string | null {
  return INDIAN_STATES.find((s) => s.code === code)?.name ?? null;
}

/** 15 characters: state code, PAN, entity number, "Z", check character. */
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function isGstinFormat(value: string): boolean {
  return GSTIN.test(value) && stateName(value.slice(0, 2)) !== null;
}

/** The state a GSTIN is registered in (its first two digits). */
export function gstinState(gstin: string): StateCode | null {
  const code = gstin.slice(0, 2);
  return (STATE_CODES as readonly string[]).includes(code)
    ? (code as StateCode)
    : null;
}

const istParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "numeric",
});

/**
 * The Indian financial year (April to March) a date falls in, in India
 * time: { key: "2026-27", short: "26-27" }.
 */
export function financialYear(date: Date): { key: string; short: string } {
  const parts = Object.fromEntries(
    istParts.formatToParts(date).map((p) => [p.type, p.value]),
  );
  const year = Number(parts.year);
  const start = Number(parts.month) >= 4 ? year : year - 1;
  const end = String((start + 1) % 100).padStart(2, "0");
  return {
    key: `${start}-${end}`,
    short: `${String(start % 100).padStart(2, "0")}-${end}`,
  };
}

/** True for India, whatever the spelling ("India", "india", "IN"). */
export function isIndia(country: string | null | undefined): boolean {
  if (!country) return true;
  return ["india", "in", "bharat"].includes(country.trim().toLowerCase());
}
