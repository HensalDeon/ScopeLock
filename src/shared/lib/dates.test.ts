import { describe, expect, it } from "vitest";
import { formatAgo, formatDate, formatDateTime } from "./dates";

const now = new Date("2026-11-20T06:00:00Z");

describe("dates (India time)", () => {
  it("formats in Asia/Kolkata regardless of server time zone", () => {
    // 10:12 UTC = 3:42 pm IST
    expect(formatDateTime(new Date("2026-11-18T10:12:00Z"), { now })).toBe(
      "18 Nov, 3:42 pm",
    );
    // 20:00 UTC on the 18th is already the 19th in India
    expect(formatDate(new Date("2026-11-18T20:00:00Z"), { now })).toBe(
      "19 Nov",
    );
  });

  it("adds the year only when it differs or is asked for", () => {
    expect(formatDate(new Date("2025-03-02T06:00:00Z"), { now })).toBe(
      "2 Mar 2025",
    );
    expect(
      formatDate(new Date("2026-03-02T06:00:00Z"), { now, withYear: true }),
    ).toBe("2 Mar 2026");
  });

  it("says how long ago, by India calendar days", () => {
    const now = new Date("2026-11-06T18:00:00Z"); // 6 Nov, 11:30 pm IST
    expect(formatAgo(new Date("2026-11-06T00:00:00Z"), { now })).toBe(
      "today, 5:30 am",
    );
    // 5 Nov, 11:00 pm IST is yesterday even though it's < 24h ago.
    expect(formatAgo(new Date("2026-11-05T17:30:00Z"), { now })).toBe(
      "yesterday",
    );
    expect(formatAgo(new Date("2026-11-03T10:00:00Z"), { now })).toBe(
      "3 days ago",
    );
    expect(formatAgo(new Date("2026-10-20T10:00:00Z"), { now })).toBe(
      "on 20 Oct",
    );
  });
});
