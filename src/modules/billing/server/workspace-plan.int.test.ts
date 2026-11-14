import { describe, expect, it } from "vitest";
import { listAdminChanges } from "@/modules/admin/server";
import { adminSubscription } from "../domain/subscription";
import { findSubscription, findSubscriptions } from "./subscriptions";
import { saveWorkspacePlan } from "./workspace-plan";

const admin = { email: "admin@scopelock.test", userId: "u1", name: "Admin" };

describe("a workspace's plan", () => {
  it("is Free until an admin sets one, then the record and log agree", async () => {
    const ws = "ws_plan_test";
    expect(await findSubscription(ws)).toMatchObject({
      planId: "free",
      source: "free",
    });

    const at = new Date();
    await saveWorkspacePlan(
      { id: ws, name: "Iyer Studio" },
      adminSubscription(
        { workspaceId: ws, planId: "pro", note: "Beta user" },
        admin.email,
        at,
      ),
      ["Plan Free → Pro", "Reason: Beta user"],
      admin,
    );

    expect(await findSubscription(ws)).toEqual({
      planId: "pro",
      source: "admin",
      note: "Beta user",
      setBy: admin.email,
      setAt: at,
      razorpay: null,
    });
    expect((await findSubscriptions([ws, "ws_other"])).get(ws)?.planId).toBe(
      "pro",
    );
    const [entry] = (await listAdminChanges(1)).items;
    expect(entry).toMatchObject({
      action: "workspace.plan_set",
      target: "Iyer Studio",
      href: `/admin/workspaces/${ws}`,
    });
  });
});
