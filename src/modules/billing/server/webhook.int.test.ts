import { describe, expect, it } from "vitest";
import { hmacHex } from "../domain/razorpay";
import { entitledPlanId } from "../domain/subscription";
import { saveRazorpayPlanLink } from "./razorpay-plans";
import { findSubscription, saveSubscription } from "./subscriptions";
import { handleRazorpayWebhook } from "./webhook";

const secret = "whsec_test";
const ws = "ws_razorpay_test";
const unix = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

function event(type: string, entity: Record<string, unknown>) {
  const rawBody = JSON.stringify({
    event: type,
    payload: { subscription: { entity } },
  });
  return { rawBody, signature: hmacHex(secret, rawBody) };
}

describe("Razorpay webhook", () => {
  it("activates a paid plan once, rejects forgeries, and lapses after cancelling", async () => {
    await saveRazorpayPlanLink("test", "pro", 49_900, "plan_test_pro");
    const sub = {
      id: "sub_test_1",
      plan_id: "plan_test_pro",
      status: "active",
      current_end: unix("2099-01-01T00:00:00Z"),
      notes: { workspaceId: ws, planId: "pro" },
    };

    const activated = event("subscription.activated", sub);
    expect(
      await handleRazorpayWebhook({
        ...activated,
        eventId: "evt_1",
        secret,
        fetchLatest: async () => sub,
      }),
    ).toEqual({ status: 200, body: "ok" });
    const saved = await findSubscription(ws);
    expect(saved).toMatchObject({ planId: "pro", source: "razorpay" });
    expect(entitledPlanId(saved, new Date())).toBe("pro");

    // The same event again is handled once.
    expect(
      await handleRazorpayWebhook({
        ...activated,
        eventId: "evt_1",
        secret,
        fetchLatest: async () => sub,
      }),
    ).toEqual({ status: 200, body: "already handled" });

    // A body that doesn't match its signature is refused.
    const forged = event("subscription.activated", {
      ...sub,
      plan_id: "plan_test_agency",
    });
    expect(
      await handleRazorpayWebhook({
        rawBody: forged.rawBody,
        signature: activated.signature,
        eventId: "evt_2",
        secret,
      }),
    ).toMatchObject({ status: 400 });

    // Cancelled, and the paid period is over: back to Free.
    const ended = event("subscription.cancelled", {
      ...sub,
      status: "cancelled",
      current_end: unix("2020-01-01T00:00:00Z"),
    });
    expect(
      await handleRazorpayWebhook({
        ...ended,
        eventId: "evt_3",
        secret,
        fetchLatest: async () => ({
          ...sub,
          status: "cancelled",
          current_end: unix("2020-01-01T00:00:00Z"),
        }),
      }),
    ).toMatchObject({ status: 200 });
    expect(entitledPlanId(await findSubscription(ws), new Date())).toBe("free");
  });

  it("never lets an old subscription's late event undo a plan an admin set", async () => {
    const ws2 = "ws_razorpay_admin";
    await saveRazorpayPlanLink("test", "agency", 199_900, "plan_test_agency");
    await saveSubscription(ws2, {
      planId: "agency",
      source: "admin",
      note: "Comp after cancelling",
      setBy: "admin@scopelock.test",
      setAt: new Date(),
      razorpay: null,
    });
    const late = event("subscription.completed", {
      id: "sub_old",
      plan_id: "plan_test_agency",
      status: "completed",
      current_end: unix("2020-01-01T00:00:00Z"),
      notes: { workspaceId: ws2 },
    });
    expect(
      await handleRazorpayWebhook({
        ...late,
        eventId: "evt_late",
        secret,
        fetchLatest: async () => ({
          id: "sub_old",
          plan_id: "plan_test_agency",
          status: "completed",
          current_end: unix("2020-01-01T00:00:00Z"),
          notes: { workspaceId: ws2 },
        }),
      }),
    ).toMatchObject({ status: 200 });
    expect(await findSubscription(ws2)).toMatchObject({
      planId: "agency",
      source: "admin",
    });
  });

  it("keeps a plan an admin set back to Free when the old subscription reports in", async () => {
    const ws3 = "ws_razorpay_free";
    await saveSubscription(ws3, {
      planId: "free",
      source: "free",
      note: "Refunded, back to Free",
      setBy: "admin@scopelock.test",
      setAt: new Date(),
      razorpay: null,
    });
    const old = {
      id: "sub_refunded",
      plan_id: "plan_test_pro",
      status: "cancelled",
      current_end: unix("2099-01-01T00:00:00Z"),
      notes: { workspaceId: ws3 },
    };
    const late = event("subscription.cancelled", old);
    await handleRazorpayWebhook({
      ...late,
      eventId: "evt_free",
      secret,
      fetchLatest: async () => old,
    });
    expect(await findSubscription(ws3)).toMatchObject({
      planId: "free",
      note: "Refunded, back to Free",
    });
  });
});
