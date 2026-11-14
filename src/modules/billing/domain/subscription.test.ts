import { describe, expect, it } from "vitest";
import { DEFAULT_PLANS } from "./plans";
import {
  adminSubscription,
  projectUsage,
  setWorkspacePlanSchema,
} from "./subscription";

const free = DEFAULT_PLANS[0]!;

describe("projectUsage", () => {
  it("is full at the limit and over past it", () => {
    expect(projectUsage(free, 1)).toEqual({
      used: 1,
      limit: 2,
      full: false,
      over: false,
    });
    expect(projectUsage(free, 2)).toMatchObject({ full: true, over: false });
    expect(projectUsage(free, 5)).toMatchObject({ full: true, over: true });
  });
});

describe("setting a workspace's plan", () => {
  it("needs a plan and a reason", () => {
    expect(
      setWorkspacePlanSchema.safeParse({
        workspaceId: "w1",
        planId: "pro",
        note: " ",
      }).success,
    ).toBe(false);
    expect(
      setWorkspacePlanSchema.safeParse({
        workspaceId: "w1",
        planId: "gold",
        note: "Beta",
      }).success,
    ).toBe(false);
  });

  it("records who gave it and why; back to Free is plain Free", () => {
    const at = new Date("2026-11-10T10:00:00Z");
    expect(
      adminSubscription(
        { workspaceId: "w1", planId: "pro", note: "Beta user" },
        "a@x.in",
        at,
      ),
    ).toEqual({
      planId: "pro",
      source: "admin",
      note: "Beta user",
      setBy: "a@x.in",
      setAt: at,
    });
    expect(
      adminSubscription(
        { workspaceId: "w1", planId: "free", note: "Beta over" },
        "a@x.in",
        at,
      ),
    ).toMatchObject({ planId: "free", source: "free" });
  });
});
