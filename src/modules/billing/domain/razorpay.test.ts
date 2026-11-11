import { describe, expect, it } from "vitest";
import { paise } from "@/shared/lib/money";
import {
  checkoutSignatureValid,
  hmacHex,
  subscriptionFromRazorpay,
  webhookSignatureValid,
} from "./razorpay";
import {
  entitledPlanId,
  FREE_SUBSCRIPTION,
  isRenewing,
  planChange,
  type Subscription,
} from "./subscription";

const at = new Date("2026-11-11T10:00:00Z");
const planFor = (id: string) =>
  id === "plan_pro" ? "pro" : id === "plan_agency" ? "agency" : null;
const entity = (patch = {}) => ({
  id: "sub_1",
  plan_id: "plan_pro",
  status: "active",
  current_end: Math.floor(new Date("2026-12-11T10:00:00Z").getTime() / 1000),
  notes: { workspaceId: "w1" },
  ...patch,
});

describe("signatures", () => {
  it("accepts Razorpay's checkout signature and rejects a tampered one", () => {
    const signature = hmacHex("secret", "pay_1|sub_1");
    expect(
      checkoutSignatureValid(
        { paymentId: "pay_1", subscriptionId: "sub_1", signature },
        "secret",
      ),
    ).toBe(true);
    expect(
      checkoutSignatureValid(
        { paymentId: "pay_2", subscriptionId: "sub_1", signature },
        "secret",
      ),
    ).toBe(false);
  });

  it("checks a webhook against its exact body", () => {
    const body = JSON.stringify({ event: "subscription.charged" });
    const sig = hmacHex("whsec", body);
    expect(webhookSignatureValid(body, sig, "whsec")).toBe(true);
    expect(webhookSignatureValid(body + " ", sig, "whsec")).toBe(false);
    expect(webhookSignatureValid(body, "short", "whsec")).toBe(false);
  });
});

describe("subscriptionFromRazorpay", () => {
  it("reads an active subscription as Pro until its period ends", () => {
    const sub = subscriptionFromRazorpay(entity(), planFor, null, at);
    expect(sub).toMatchObject({ planId: "pro", source: "razorpay" });
    expect(sub?.razorpay?.currentEnd?.toISOString()).toBe(
      "2026-12-11T10:00:00.000Z",
    );
    expect(entitledPlanId(sub as Subscription, at)).toBe("pro");
    expect(isRenewing(sub as Subscription)).toBe(true);
  });

  it("ignores plans that aren't ours", () => {
    expect(
      subscriptionFromRazorpay(
        entity({ plan_id: "plan_x" }),
        planFor,
        null,
        at,
      ),
    ).toBe(null);
  });

  it("keeps a cancelled plan until the paid period ends, then Free", () => {
    const sub = subscriptionFromRazorpay(
      entity({ status: "cancelled" }),
      planFor,
      null,
      at,
    ) as Subscription;
    expect(entitledPlanId(sub, at)).toBe("pro");
    expect(entitledPlanId(sub, new Date("2026-12-12T00:00:00Z"))).toBe("free");
    expect(isRenewing(sub)).toBe(false);
  });

  it("drops to Free when payments failed for good", () => {
    const sub = subscriptionFromRazorpay(
      entity({ status: "halted" }),
      planFor,
      null,
      at,
    ) as Subscription;
    expect(entitledPlanId(sub, at)).toBe("free");
  });

  it("remembers a cancellation or downgrade the customer asked for", () => {
    const previous = subscriptionFromRazorpay(entity(), planFor, null, at)!;
    previous.razorpay = {
      ...previous.razorpay!,
      cancelAtCycleEnd: true,
      scheduledPlanId: null,
    };
    const next = subscriptionFromRazorpay(entity(), planFor, previous, at)!;
    expect(next.razorpay?.cancelAtCycleEnd).toBe(true);
  });
});

describe("planChange", () => {
  const free = { id: "free" as const, monthlyPrice: paise(0) };
  const pro = { id: "pro" as const, monthlyPrice: paise(49_900) };
  const agency = { id: "agency" as const, monthlyPrice: paise(199_900) };
  it("subscribes from Free, upgrades and downgrades between paid, cancels to Free", () => {
    expect(planChange({ plan: free, renewing: false }, pro)).toBe("subscribe");
    expect(planChange({ plan: pro, renewing: true }, agency)).toBe("upgrade");
    expect(planChange({ plan: agency, renewing: true }, pro)).toBe("downgrade");
    expect(planChange({ plan: pro, renewing: true }, free)).toBe("cancel");
    expect(planChange({ plan: pro, renewing: true }, pro)).toBe("current");
    // Cancelled (or given) Pro with days left: a new plan starts afresh.
    expect(planChange({ plan: pro, renewing: false }, agency)).toBe("restart");
    expect(planChange({ plan: pro, renewing: false }, free)).toBe("current");
  });
});

describe("entitledPlanId", () => {
  it("uses the stored plan for Free and admin-given plans", () => {
    expect(entitledPlanId(FREE_SUBSCRIPTION, at)).toBe("free");
    expect(
      entitledPlanId(
        { ...FREE_SUBSCRIPTION, planId: "agency", source: "admin" },
        at,
      ),
    ).toBe("agency");
  });
});
