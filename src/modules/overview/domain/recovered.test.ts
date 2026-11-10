import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import { latestApproved, revenueRecovered } from "./recovered";

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
      received: minor(0),
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

  it("keeps currencies apart, rupees first then A–Z (the money strip's order)", () => {
    const rows = revenueRecovered(
      [
        // More cents than the rupee amount has paise: order must not depend on it.
        {
          currency: "USD",
          total: minor(1_245_075),
          approvedAt: at("2026-11-01T10:00:00Z"),
        },
        {
          currency: "INR",
          total: minor(900_000),
          approvedAt: at("2026-09-01T10:00:00Z"),
        },
        {
          currency: "AED",
          total: minor(480_000),
          approvedAt: at("2026-11-03T10:00:00Z"),
        },
      ],
      now,
    );
    expect(rows.map((r) => r.currency)).toEqual(["INR", "AED", "USD"]);
    expect(rows[0]?.thisMonth).toBe(minor(0));
  });

  it("says how much of it has been received, per currency", () => {
    const [inr, usd] = revenueRecovered(
      [
        {
          currency: "INR",
          total: minor(2_000_000),
          approvedAt: at("2026-11-02T10:00:00Z"),
        },
        {
          currency: "USD",
          total: minor(50_000),
          approvedAt: at("2026-11-02T10:00:00Z"),
        },
      ],
      now,
      [
        { currency: "INR", amount: minor(1_500_000) },
        { currency: "USD", amount: minor(80_000) },
      ],
    );
    expect(inr?.received).toBe(minor(1_500_000));
    // Never more than was approved.
    expect(usd?.received).toBe(minor(50_000));
  });

  it("is empty with nothing approved", () => {
    expect(revenueRecovered([], now)).toEqual([]);
  });
});

describe("latestApproved", () => {
  it("picks the most recent approval", () => {
    const latest = latestApproved([
      { id: "a", approvedAt: at("2026-11-01T10:00:00Z") },
      { id: "b", approvedAt: at("2026-11-08T10:00:00Z") },
      { id: "c", approvedAt: at("2026-10-20T10:00:00Z") },
    ]);
    expect(latest?.id).toBe("b");
  });
  it("is null with nothing approved", () => {
    expect(latestApproved([])).toBeNull();
  });
});
