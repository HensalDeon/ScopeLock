"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { workspaceAction } from "@/modules/workspace/server";
import { UserError } from "@/shared/lib/form-state";
import { formatDate } from "@/shared/lib/dates";
import { checkoutSignatureValid } from "../domain/razorpay";
import { planById, PLAN_IDS } from "../domain/plans";
import { isRenewing, planChange } from "../domain/subscription";
import { getPlans, getWorkspacePlan } from "./queries";
import {
  cancelRazorpaySubscription,
  cancelScheduledRazorpayChange,
  changeRazorpayPlan,
  createRazorpaySubscription,
  fetchRazorpaySubscription,
  razorpaySecrets,
} from "./razorpay";
import { applyRazorpaySubscription, razorpayPlanFor } from "./razorpay-sync";
import {
  findCheckoutAttempt,
  findSubscription,
  saveCheckoutAttempt,
  saveSubscription,
} from "./subscriptions";

/** Only the people who run the workspace pay for it. */
// Only the owner changes what the workspace pays for.
const OWNERS = ["owner"] as const;
const planSchema = z.object({ planId: z.enum(PLAN_IDS) });

async function target(planId: string) {
  const plan = planById(await getPlans(), planId);
  if (!plan) throw new UserError("That plan doesn't exist.");
  return plan;
}

/**
 * Step 1 of paying: a Razorpay subscription for the chosen plan, opened in
 * Checkout by the browser. Nothing changes here until it's paid.
 */
export const startCheckout = workspaceAction(
  {
    fields: ["planId"],
    schema: planSchema,
    roles: OWNERS,
    failureMessage: "Couldn't open the payment. Nothing was charged.",
  },
  async ({ planId }, { workspace }) => {
    const plan = await target(planId);
    const current = await getWorkspacePlan(workspace.workspaceId);
    const kind = planChange(
      { plan: current.plan, renewing: isRenewing(current.subscription) },
      plan,
    );
    if (kind !== "subscribe" && kind !== "restart")
      throw new UserError("Refresh the page: your plan has changed.");
    // A Checkout paid earlier whose confirmation didn't arrive: apply it
    // instead of charging again.
    const earlier = await findCheckoutAttempt(workspace.workspaceId);
    if (earlier) {
      const entity = await fetchRazorpaySubscription(earlier.subscriptionId);
      if (["authenticated", "active", "pending"].includes(entity.status)) {
        await applyRazorpaySubscription(entity);
        refresh();
        throw new UserError(
          "Your earlier payment went through, so nothing more was charged. Your plan is updated.",
        );
      }
      // Unpaid (created): Razorpay never charges it. Reuse it only for the
      // same plan at today's price (an admin may have changed the price).
      if (
        entity.status === "created" &&
        entity.plan_id === (await razorpayPlanFor(plan))
      )
        return { id: earlier.subscriptionId };
    }
    const sub = await createRazorpaySubscription({
      razorpayPlanId: await razorpayPlanFor(plan),
      notes: { workspaceId: workspace.workspaceId, planId: plan.id },
    });
    await saveCheckoutAttempt(workspace.workspaceId, {
      subscriptionId: sub.id,
      planId: plan.id,
    });
    return { id: sub.id };
  },
);

const confirmSchema = z.object({
  paymentId: z.string().trim().min(1).max(64),
  subscriptionId: z.string().trim().min(1).max(64),
  signature: z.string().trim().min(1).max(256),
});

/**
 * Step 2: Checkout says it's paid. Trusted only with Razorpay's signature,
 * then read back from Razorpay itself (the webhook says the same later).
 */
export const confirmCheckout = workspaceAction(
  {
    fields: ["paymentId", "subscriptionId", "signature"],
    schema: confirmSchema,
    roles: OWNERS,
    failureMessage:
      "We couldn't confirm the payment yet. If you were charged, your plan updates within a few minutes.",
  },
  async (input, { workspace }) => {
    if (!checkoutSignatureValid(input, razorpaySecrets().key))
      throw new UserError(
        "That payment couldn't be verified. If you were charged, contact us.",
      );
    // The payment is real (signed); it belongs to the workspace it was
    // started from, even if another one is open in this tab now.
    const entity = await fetchRazorpaySubscription(input.subscriptionId);
    const applied = await applyRazorpaySubscription(entity);
    if (!applied)
      throw new UserError(
        "We couldn't match that payment to a workspace. If you were charged, contact us.",
      );
    refresh();
    if (applied !== workspace.workspaceId)
      return {
        message:
          "Paid. The plan applies to the workspace you started paying from.",
      };
    const { plan } = await getWorkspacePlan(workspace.workspaceId);
    return { message: `Paid. You're on ${plan.name} now.` };
  },
);

/**
 * A paying workspace moves to another paid plan: up straight away (Razorpay
 * charges the difference), down from the next billing date.
 */
export const switchPlan = workspaceAction(
  {
    fields: ["planId"],
    schema: planSchema,
    roles: OWNERS,
    failureMessage: "Your plan wasn't changed. Please try again.",
  },
  async ({ planId }, { workspace }) => {
    const plan = await target(planId);
    const current = await getWorkspacePlan(workspace.workspaceId);
    const rz = current.subscription.razorpay;
    const kind = planChange(
      { plan: current.plan, renewing: isRenewing(current.subscription) },
      plan,
    );
    if (!rz || (kind !== "upgrade" && kind !== "downgrade"))
      throw new UserError("Refresh the page: your plan has changed.");
    const when = kind === "upgrade" ? "now" : "cycle_end";
    const entity = await changeRazorpayPlan(
      rz.subscriptionId,
      await razorpayPlanFor(plan),
      when,
    );
    if (when === "now") {
      await applyRazorpaySubscription(entity);
    } else {
      const sub = await findSubscription(workspace.workspaceId);
      if (sub.razorpay)
        await saveSubscription(workspace.workspaceId, {
          ...sub,
          razorpay: { ...sub.razorpay, scheduledPlanId: plan.id },
        });
    }
    refresh();
    return {
      message:
        when === "now"
          ? `You're on ${plan.name} now.`
          : `You'll move to ${plan.name} on ${rz.currentEnd ? formatDate(rz.currentEnd) : "your next billing date"}.`,
    };
  },
);

/** Stop renewing: the plan runs to the end of the period paid for. */
export const cancelPlan = workspaceAction(
  {
    fields: [],
    schema: z.object({}),
    roles: OWNERS,
    failureMessage: "Your plan wasn't cancelled. Please try again.",
  },
  async (_input, { workspace }) => {
    const sub = await findSubscription(workspace.workspaceId);
    if (!sub.razorpay || !isRenewing(sub))
      throw new UserError("Refresh the page: there's nothing to cancel.");
    const entity = await cancelRazorpaySubscription(
      sub.razorpay.subscriptionId,
    );
    await saveSubscription(workspace.workspaceId, {
      ...sub,
      razorpay: {
        ...sub.razorpay,
        cancelAtCycleEnd: true,
        currentEnd: entity.current_end
          ? new Date(entity.current_end * 1000)
          : sub.razorpay.currentEnd,
      },
    });
    refresh();
    const end = entity.current_end
      ? new Date(entity.current_end * 1000)
      : sub.razorpay.currentEnd;
    return {
      message: `Cancelled. You keep your plan${end ? ` until ${formatDate(end)}` : " until the end of this billing period"}, then move to Free.`,
    };
  },
);

/** Undo a move to a smaller plan that's waiting for the next billing date. */
export const keepPlan = workspaceAction(
  {
    fields: [],
    schema: z.object({}),
    roles: OWNERS,
    failureMessage: "Nothing was changed. Please try again.",
  },
  async (_input, { workspace }) => {
    const sub = await findSubscription(workspace.workspaceId);
    if (!sub.razorpay?.scheduledPlanId || !isRenewing(sub))
      throw new UserError("Refresh the page: there's no change waiting.");
    await cancelScheduledRazorpayChange(sub.razorpay.subscriptionId);
    await saveSubscription(workspace.workspaceId, {
      ...sub,
      razorpay: { ...sub.razorpay, scheduledPlanId: null },
    });
    refresh();
    return { message: "Done. Your plan stays as it is." };
  },
);
