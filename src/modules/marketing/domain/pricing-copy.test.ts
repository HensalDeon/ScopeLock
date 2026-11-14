import { describe, expect, it } from "vitest";
import { coverage, pricingDescription } from "./pricing-copy";

describe("coverage", () => {
  it("says how long a change pays for a plan", () => {
    expect(coverage(1_500_000, 49_900)).toBe("over two years");
    expect(coverage(1_500_000, 62_500)).toBe("two years");
    expect(coverage(1_500_000, 99_900)).toBe("over a year");
    expect(coverage(1_500_000, 199_900)).toBe("7 months");
    expect(coverage(1_500_000, 1_500_000)).toBe("1 month");
  });
  it("says nothing when it can't cover a month or the plan is free", () => {
    expect(coverage(1_000, 49_900)).toBe("");
    expect(coverage(1_500_000, 0)).toBe("");
  });
});

describe("pricingDescription", () => {
  it("reads the live prices", () => {
    expect(
      pricingDescription([
        {
          id: "free",
          name: "Free",
          monthlyPrice: 0,
          activeProjects: 2,
          summary: "For trying it.",
        },
        {
          id: "pro",
          name: "Pro",
          monthlyPrice: 49_900,
          activeProjects: 6,
          summary: "For freelancers.",
        },
        {
          id: "agency",
          name: "Agency",
          monthlyPrice: 199_900,
          activeProjects: 15,
          summary: "For agencies.",
        },
      ]),
    ).toBe(
      "ScopeLock is free for 2 active projects. Pro is ₹499 a month, for freelancers. Agency is ₹1,999 a month, for agencies.",
    );
  });
});
