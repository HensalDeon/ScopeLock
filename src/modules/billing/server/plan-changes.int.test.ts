import { describe, expect, it } from "vitest";
import { listAdminChanges } from "@/modules/admin/server";
import { paise } from "@/shared/lib/money";
import { completePlans, DEFAULT_PLANS, planChanges } from "../domain/plans";
import { savePlanChange } from "./plan-changes";
import { findPlans, findPriceHistory } from "./repository";

const admin = { email: "admin@scopelock.test", userId: "u1", name: "Admin" };
const agency = DEFAULT_PLANS[2]!;

describe("saving a plan", () => {
  it("stores the plan, its price history and the audit entry", async () => {
    const first = { ...agency, monthlyPrice: paise(249_900) };
    await savePlanChange(agency, first, planChanges(agency, first), admin);
    const second = { ...first, activeProjects: 20 };
    await savePlanChange(first, second, planChanges(first, second), admin);

    expect(completePlans(await findPlans())[2]).toEqual(second);
    // The first price change also kept the starting price; a change that
    // leaves the price alone adds nothing.
    expect(
      (await findPriceHistory("agency")).map((p) => [
        p.monthlyPrice,
        p.createdBy,
      ]),
    ).toEqual([
      [249_900, admin.email],
      [199_900, "starting price"],
    ]);
    const log = await listAdminChanges(1);
    expect(log.items.slice(0, 2).map((e) => e.changes)).toEqual([
      ["Active projects 15 → 20"],
      ["Price ₹1,999 → ₹2,499 a month"],
    ]);
  });
});
