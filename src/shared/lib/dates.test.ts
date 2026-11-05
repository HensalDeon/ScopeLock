import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./dates";

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
});
