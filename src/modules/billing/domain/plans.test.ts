import { describe, expect, it } from "vitest";
import { paise } from "@/shared/lib/money";
import {
  completePlans,
  DEFAULT_PLANS,
  planChanges,
  planFromInput,
  planFormValues,
  planInputSchema,
} from "./plans";

const pro = DEFAULT_PLANS[1]!;
const input = {
  id: "pro",
  name: "Pro",
  summary: "For freelancers.",
  monthlyRupees: "599",
  activeProjects: "8",
  teamMembers: "1",
  features: ["brandedClientPages"],
  highlights: [{ label: "8 active projects", soon: false }],
};

describe("planInputSchema", () => {
  it("accepts a paid plan in whole rupees", () => {
    const parsed = planInputSchema.parse(input);
    const plan = planFromInput(parsed);
    expect(plan.monthlyPrice).toBe(paise(59_900));
    expect(plan.activeProjects).toBe(8);
    expect(plan.features.brandedClientPages).toBe(true);
    expect(plan.features.prioritySupport).toBe(false);
  });

  it("keeps Free at ₹0 and paid plans above it", () => {
    expect(
      planInputSchema.safeParse({ ...input, id: "free", monthlyRupees: "99" })
        .success,
    ).toBe(false);
    expect(
      planInputSchema.safeParse({ ...input, monthlyRupees: "0" }).success,
    ).toBe(false);
  });

  it("rejects decimals, negatives and silly prices", () => {
    for (const monthlyRupees of ["499.50", "-1", "10000001"])
      expect(
        planInputSchema.safeParse({ ...input, monthlyRupees }).success,
      ).toBe(false);
  });

  it("caps the pricing page list", () => {
    const highlights = Array.from({ length: 13 }, (_, i) => ({
      label: `Line ${i}`,
      soon: false,
    }));
    expect(planInputSchema.safeParse({ ...input, highlights }).success).toBe(
      false,
    );
  });
});

describe("planChanges", () => {
  it("says what changed, in words", () => {
    const after = {
      ...pro,
      monthlyPrice: paise(59_900),
      activeProjects: 8,
      features: { ...pro.features, recoveredReports: true },
    };
    expect(planChanges(pro, after)).toEqual([
      "Price ₹499 → ₹599 a month",
      "Active projects 6 → 8",
      "Revenue recovered reports turned on",
    ]);
  });
  it("is empty when nothing changed", () => {
    expect(planChanges(pro, { ...pro })).toEqual([]);
  });
});

describe("completePlans", () => {
  it("returns Free, Pro, Agency, filling gaps with defaults", () => {
    const stored = [{ ...pro, name: "Pro plus" }];
    expect(completePlans(stored).map((p) => p.name)).toEqual([
      "Free",
      "Pro plus",
      "Agency",
    ]);
  });
});

describe("planFormValues", () => {
  it("round-trips every default plan through the form unchanged", () => {
    for (const plan of DEFAULT_PLANS)
      expect(
        planFromInput(planInputSchema.parse(planFormValues(plan))),
      ).toEqual(plan);
  });
});
