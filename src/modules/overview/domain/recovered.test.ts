import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import { revenueRecovered } from "./recovered";

const at = (iso: string) => new Date(iso);
const now = at("2026-11-10T12:00:00+05:30");

describe("revenueRecovered", () => {
  it("adds approved changes this month and all time", () => {
    const [inr] = revenueRecovered(
      [
        {
          currency: "INR",
          total: minor(1_500_000),
          approvedAt: at("2026-11-02T10:00:00+05:30"),
        },
        {
          currency: "INR",
          total: minor(800_000),
          approvedAt: at("2026-10-20T10:00:00+05:30"),
        },
        {
          currency: "INR",
          total: minor(450_000),
          approvedAt: at("2026-11-09T18:00:00+05:30"),
        },
      ],
      now,
    );
    expect(inr).toEqual({
      currency: "INR",
      thisMonth: minor(1_950_000),
      thisMonthCount: 2,
      allTime: minor(2_750_000),
      allTimeCount: 3,
    });
  });

  it("counts the month in India time", () => {
    // 31 Oct, 7:00 pm UTC is already 1 Nov, 12:30 am in India.
    const [inr] = revenueRecovered(
      [
        {
          currency: "INR",
          total: minor(100_000),
          approvedAt: at("2026-10-31T19:00:00Z"),
        },
      ],
      now,
    );
    expect(inr?.thisMonthCount).toBe(1);
  });

  it("keeps currencies apart, largest first", () => {
    const rows = revenueRecovered(
      [
        {
          currency: "USD",
          total: minor(50_000),
          approvedAt: at("2026-11-01T10:00:00Z"),
        },
        {
          currency: "INR",
          total: minor(1_500_000),
          approvedAt: at("2026-09-01T10:00:00Z"),
        },
      ],
      now,
    );
    expect(rows.map((r) => r.currency)).toEqual(["INR", "USD"]);
    expect(rows[0]?.thisMonth).toBe(minor(0));
    expect(rows[1]?.thisMonth).toBe(minor(50_000));
  });

  it("is empty with nothing approved", () => {
    expect(revenueRecovered([], now)).toEqual([]);
  });
});
