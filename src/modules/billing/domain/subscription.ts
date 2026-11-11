/**
 * Which plan a workspace is on, and how much of it is used. A workspace
 * with no record is on Free. Until paid plans open, only an admin can put a
 * workspace on another plan (beta users, comps); Razorpay comes later.
 */
import { z } from "zod";
import { PLAN_IDS, type Plan, type PlanId } from "./plans";

export const PLAN_SOURCES = ["free", "admin", "razorpay"] as const;
export type PlanSource = (typeof PLAN_SOURCES)[number];

/** Razorpay's subscription states (their names). */
export const RAZORPAY_STATUSES = [
  "created",
  "authenticated",
  "active",
  "pending",
  "halted",
  "cancelled",
  "completed",
  "expired",
  "paused",
] as const;
export type RazorpayStatus = (typeof RAZORPAY_STATUSES)[number];

/** A paid subscription, as Razorpay last told us. */
export type RazorpayState = {
  subscriptionId: string;
  status: RazorpayStatus;
  /** Razorpay's plan (one per price); maps to our plan via price history. */
  razorpayPlanId: string;
  /** End of the period paid for (null before the first charge). */
  currentEnd: Date | null;
  /** Cancelled by the customer: ends at currentEnd, not renewed. */
  cancelAtCycleEnd: boolean;
  /** A move to a smaller plan, taking effect at currentEnd. */
  scheduledPlanId: PlanId | null;
  /** Razorpay's page for this subscription (pay again after a failure). */
  shortUrl?: string | null;
};

export type Subscription = {
  planId: PlanId;
  /** How the workspace got this plan. */
  source: PlanSource;
  /** Why, for admin changes ("Beta user, free till March"). Admin only. */
  note: string | null;
  setBy: string | null;
  setAt: Date | null;
  /** Set when paid through Razorpay. */
  razorpay?: RazorpayState | null;
};

export const FREE_SUBSCRIPTION: Subscription = {
  planId: "free",
  source: "free",
  note: null,
  setBy: null,
  setAt: null,
  razorpay: null,
};

/**
 * The plan a workspace can use right now. Paid: while Razorpay says it's
 * running (a retrying payment included), or after a cancellation until the
 * end of the period already paid for. A payment that failed for good
 * (halted) drops to Free.
 */
export function entitledPlanId(sub: Subscription, now: Date): PlanId {
  if (sub.source !== "razorpay" || !sub.razorpay) return sub.planId;
  const { status, currentEnd, cancelAtCycleEnd } = sub.razorpay;
  // Paid up to a date: once it's passed, a cancelled plan is over whatever
  // a late event said about its status.
  const paidUp = Boolean(currentEnd && currentEnd > now);
  if (cancelAtCycleEnd) return paidUp ? sub.planId : "free";
  if (status === "authenticated" || status === "active" || status === "pending")
    return sub.planId;
  if (
    (status === "cancelled" ||
      status === "completed" ||
      status === "expired") &&
    paidUp
  )
    return sub.planId;
  return "free";
}

/**
 * Razorpay should have renewed or ended this by now (a webhook may have
 * been missed): worth reading it again from Razorpay.
 */
export function needsResync(sub: Subscription, now: Date): boolean {
  const rz = sub.source === "razorpay" ? sub.razorpay : null;
  if (!rz?.currentEnd) return false;
  const live = ["authenticated", "active", "pending"].includes(rz.status);
  const overdue = now.getTime() - rz.currentEnd.getTime() > 2 * 86_400_000;
  return live && overdue;
}

/** A Razorpay subscription that's still billing (can be switched or cancelled). */
export function isRenewing(sub: Subscription): boolean {
  const s = sub.razorpay;
  return Boolean(
    sub.source === "razorpay" &&
    s &&
    !s.cancelAtCycleEnd &&
    (s.status === "authenticated" ||
      s.status === "active" ||
      s.status === "pending"),
  );
}

export type PlanChange =
  | "current"
  /** From Free to a paid plan: checkout. */
  | "subscribe"
  /**
   * A paid plan that won't renew (cancelled with days left, or given by
   * hand): another paid plan starts now as a new subscription; the days
   * left aren't refunded.
   */
  | "restart"
  /** Paid to a pricier plan: now, the difference charged by Razorpay. */
  | "upgrade"
  /** Paid to a cheaper plan: from the next billing date. */
  | "downgrade"
  /** Paid to Free: at the end of the period paid for. */
  | "cancel";

/** What choosing `target` would do for a workspace on `current`. */
export function planChange(
  current: { plan: Pick<Plan, "id" | "monthlyPrice">; renewing: boolean },
  target: Pick<Plan, "id" | "monthlyPrice">,
): PlanChange {
  if (target.id === current.plan.id) return "current";
  if (!current.renewing) {
    if (target.monthlyPrice === 0) return "current";
    return current.plan.monthlyPrice > 0 ? "restart" : "subscribe";
  }
  if (target.monthlyPrice === 0) return "cancel";
  return target.monthlyPrice > current.plan.monthlyPrice
    ? "upgrade"
    : "downgrade";
}

export type Usage = {
  used: number;
  limit: number;
  /** Can't add another (used ≥ limit). */
  full: boolean;
  /** More than the plan allows (after a move to a smaller plan). */
  over: boolean;
};

export function usage(used: number, limit: number): Usage {
  return { used, limit, full: used >= limit, over: used > limit };
}

/** Active projects (anything not archived) against the plan's limit. */
export function projectUsage(plan: Plan, activeProjects: number): Usage {
  return usage(activeProjects, plan.activeProjects);
}

/** What the admin sends to put a workspace on a plan. */
export const setWorkspacePlanSchema = z.object({
  workspaceId: z.string().trim().min(1).max(64),
  planId: z.enum(PLAN_IDS, { error: "Choose a plan." }),
  note: z
    .string()
    .trim()
    .min(1, "Say why, so the change log makes sense later.")
    .max(140, "Keep it to 140 characters."),
});
export type SetWorkspacePlanInput = z.output<typeof setWorkspacePlanSchema>;

/** The admin's choice as the workspace's record. */
export function adminSubscription(
  input: SetWorkspacePlanInput,
  by: string,
  at: Date,
): Subscription {
  return input.planId === "free"
    ? { ...FREE_SUBSCRIPTION, note: input.note, setBy: by, setAt: at }
    : {
        planId: input.planId,
        source: "admin",
        note: input.note,
        setBy: by,
        setAt: at,
      };
}
