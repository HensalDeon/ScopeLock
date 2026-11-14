import { describe, expect, it } from "vitest";
import {
  financialYearLabel,
  financialYearOf,
  monthKeyOf,
  monthsOf,
  parseFinancialYear,
} from "./financial-year";

const ist = (s: string) => new Date(`${s}+05:30`);

describe("financial years", () => {
  it("runs April to March, in India time", () => {
    expect(financialYearOf(ist("2026-04-01T00:30:00"))).toBe(2026);
    // 31 March, 11 pm in India is still the old year (UTC says 31 March too).
    expect(financialYearOf(ist("2027-03-31T23:00:00"))).toBe(2026);
    // 1 April, 1 am in India: UTC is still 31 March, the year has turned.
    expect(financialYearOf(ist("2027-04-01T01:00:00"))).toBe(2027);
    expect(financialYearOf(ist("2027-01-15T12:00:00"))).toBe(2026);
  });

  it("is named the way accountants write it", () => {
    expect(financialYearLabel(2026)).toBe("2026–27");
    expect(financialYearLabel(2099)).toBe("2099–00");
  });

  it("reads ?year= safely", () => {
    expect(parseFinancialYear("2025")).toBe(2025);
    expect(parseFinancialYear(["2024", "2025"])).toBe(2024);
    expect(parseFinancialYear("25")).toBeNull();
    expect(parseFinancialYear("1999")).toBeNull();
    expect(parseFinancialYear(undefined)).toBeNull();
  });

  it("lists the year's months, April first, only up to now", () => {
    const now = ist("2026-11-13T10:00:00");
    const months = monthsOf(2026, now);
    expect(months[0]).toEqual({ key: "2026-04", label: "Apr 2026" });
    expect(months.at(-1)).toEqual({ key: "2026-11", label: "Nov 2026" });
    expect(months).toHaveLength(8);
    const past = monthsOf(2025, now);
    expect(past).toHaveLength(12);
    expect(past.at(-1)).toEqual({ key: "2026-03", label: "Mar 2026" });
    expect(monthKeyOf(ist("2026-12-01T00:10:00"))).toBe("2026-12");
  });
});
