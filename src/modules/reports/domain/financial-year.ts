import { todayInIndia } from "@/shared/lib/dates";

/**
 * Indian financial years (1 April to 31 March), named by the year they
 * start in: 2026 is FY 2026–27. Dates are read in India time.
 */

/** The financial year a moment falls in. */
export function financialYearOf(at: Date): number {
  const [year, month] = todayInIndia(at).split("-").map(Number) as [
    number,
    number,
  ];
  return month >= 4 ? year : year - 1;
}

/** 2026 → "2026–27". */
export function financialYearLabel(fy: number): string {
  return `${fy}–${String((fy + 1) % 100).padStart(2, "0")}`;
}

/** "?year=2026" → 2026, or null for anything else. */
export function parseFinancialYear(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !/^\d{4}$/.test(raw)) return null;
  const year = Number(raw);
  return year >= 2020 && year <= 2100 ? year : null;
}

export type FyMonth = { key: string; label: string };

const MONTH_NAMES = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
] as const;

/**
 * The months of a financial year, April first: { key: "2026-04", label:
 * "Apr 2026" }. For the current year, only up to this month.
 */
export function monthsOf(fy: number, now: Date): FyMonth[] {
  const current = todayInIndia(now).slice(0, 7);
  return MONTH_NAMES.map((name, i) => {
    const year = i < 9 ? fy : fy + 1;
    const month = ((i + 3) % 12) + 1;
    return {
      key: `${year}-${String(month).padStart(2, "0")}`,
      label: `${name} ${year}`,
    };
  }).filter((m) => m.key <= current);
}

/** The month a moment falls in, as a key ("2026-11"), India time. */
export function monthKeyOf(at: Date): string {
  return todayInIndia(at).slice(0, 7);
}
