import { describe, expect, it } from "vitest";
import {
  financialYear,
  gstinState,
  isGstinFormat,
  isIndia,
  stateName,
} from "./india";

describe("India helpers", () => {
  it("checks GSTINs and reads their state", () => {
    expect(isGstinFormat("32ABCDE1234F1Z5")).toBe(true); // Kerala
    expect(gstinState("32ABCDE1234F1Z5")).toBe("32");
    expect(stateName("32")).toBe("Kerala");
    expect(isGstinFormat("32ABCDE1234F1Y5")).toBe(false); // 14th char must be Z
    expect(isGstinFormat("99ABCDE1234F1Z5")).toBe(false); // no such state
    expect(isGstinFormat("32abcde1234f1z5")).toBe(false);
  });

  it("works out the financial year in India time", () => {
    expect(financialYear(new Date("2026-11-08T10:00:00Z"))).toEqual({
      key: "2026-27",
      short: "26-27",
    });
    expect(financialYear(new Date("2027-03-31T18:00:00Z"))).toEqual({
      key: "2026-27",
      short: "26-27",
    }); // 31 Mar 11:30 pm IST
    expect(financialYear(new Date("2027-03-31T18:31:00Z"))).toEqual({
      key: "2027-28",
      short: "27-28",
    }); // 1 Apr IST
    expect(financialYear(new Date("2099-12-01T00:00:00Z")).key).toBe("2099-00");
  });

  it("treats a missing country as India", () => {
    expect(isIndia(null)).toBe(true);
    expect(isIndia(" India ")).toBe(true);
    expect(isIndia("United States")).toBe(false);
  });
});
