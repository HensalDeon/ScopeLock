/**
 * Which plan a workspace is on, and how much of it is used. A workspace
 * with no record is on Free. Until paid plans open, only an admin can put a
 * workspace on another plan (beta users, comps); Razorpay comes later.
 */
import { z } from "zod";
import { PLAN_IDS, type Plan, type PlanId } from "./plans";

export const PLAN_SOURCES = ["free", "admin", "razorpay"] as const;
export type PlanSource = (typeof PLAN_SOURCES)[number];

export type Subscription = {
  planId: PlanId;
  /** How the workspace got this plan. */
  source: PlanSource;
  /** Why, for admin changes ("Beta user, free till March"). Admin only. */
  note: string | null;
  setBy: string | null;
  setAt: Date | null;
};

export const FREE_SUBSCRIPTION: Subscription = {
  planId: "free",
  source: "free",
  note: null,
  setBy: null,
  setAt: null,
};

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
