import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import { portfolioTotals } from "./portfolio";

const p = (
  status: "draft" | "awaiting_approval" | "active" | "completed" | "archived",
  total: number,
  extra: {
    approvedChanges?: number;
    pendingChanges?: number;
    paid?: number;
    due?: number;
    currency?: "INR" | "USD";
  } = {},
) => ({
  status,
  currency: extra.currency ?? ("INR" as const),
  baselineTotal: minor(total),
  totals: {
    baseline: minor(total),
    approvedChanges: minor(extra.approvedChanges ?? 0),
    pendingChanges: minor(extra.pendingChanges ?? 0),
    paid: minor(extra.paid ?? 0),
    due: minor(extra.due ?? 0),
  },
});

describe("portfolioTotals", () => {
  it("adds approved work, waiting amounts and drafts per currency", () => {
    const rows = portfolioTotals([
      p("active", 8_300_000, {
        approvedChanges: 1_500_000,
        pendingChanges: 600_000,
        paid: 2_490_000,
        due: 4_820_000,
      }),
      p("awaiting_approval", 2_000_000),
      p("draft", 4_000_000),
      p("draft", 1_800_000),
      p("archived", 9_900_000),
      p("active", 120_000, { currency: "USD" }),
    ]);
    expect(rows.map((r) => r.currency)).toEqual(["INR", "USD"]);
    expect(rows[0]).toMatchObject({
      total: 9_800_000,
      toAsk: 2_490_000,
      approvedProjects: 1,
      waiting: 2_600_000,
      draft: 5_800_000,
      draftProjects: 2,
      received: 2_490_000,
      due: 4_820_000,
    });
    expect(rows[1]).toMatchObject({ total: 120_000, waiting: 0, draft: 0 });
  });

  it("counts approved projects as their own strip does, GST included", () => {
    const [row] = portfolioTotals([
      {
        ...p("active", 8_000_000),
        money: {
          received: minor(2_832_000),
          due: minor(3_200_000),
          toAsk: minor(2_832_000),
          total: minor(8_864_000),
          tax: minor(864_000),
          nextAsk: null,
        },
      },
    ]);
    expect(row).toMatchObject({
      received: 2_832_000,
      due: 3_200_000,
      toAsk: 2_832_000,
      total: 8_864_000,
      tax: 864_000,
    });
  });

  it("is empty with no projects", () => {
    expect(portfolioTotals([])).toEqual([]);
  });
});
