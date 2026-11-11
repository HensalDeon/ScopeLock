"use server";

import { refresh } from "next/cache";
import { adminAction } from "@/modules/admin/server";
import { findDirectoryEntry } from "@/shared/auth/directory";
import { UserError } from "@/shared/lib/form-state";
import { planById } from "../domain/plans";
import {
  adminSubscription,
  isRenewing,
  setWorkspacePlanSchema,
} from "../domain/subscription";
import { getPlans } from "./queries";
import { findSubscription } from "./subscriptions";
import { saveWorkspacePlan } from "./workspace-plan";

/**
 * Admin: put a workspace on a plan by hand (beta users, comps), with a
 * reason. Applies at once; it's written to the change log.
 */
export const setWorkspacePlan = adminAction(
  {
    fields: ["workspaceId", "planId", "note"] as const,
    schema: setWorkspacePlanSchema,
  },
  async (input, admin) => {
    const workspace = await findDirectoryEntry(input.workspaceId);
    if (!workspace) throw new UserError("That workspace doesn't exist.");
    const [plans, before] = await Promise.all([
      getPlans(),
      findSubscription(input.workspaceId),
    ]);
    const name = (id: string) => planById(plans, id)?.name ?? id;
    // A paying customer's Razorpay subscription would keep charging.
    if (isRenewing(before))
      throw new UserError(
        "This workspace pays through Razorpay. They cancel from Settings → Plan & usage (or cancel it in the Razorpay dashboard) before you set a plan by hand.",
      );
    if (before.planId === input.planId && before.note === input.note)
      return { message: "Nothing changed." };

    const changes = [
      before.planId === input.planId
        ? `Still on ${name(input.planId)}`
        : `Plan ${name(before.planId)} → ${name(input.planId)}`,
      `Reason: ${input.note}`,
    ];
    await saveWorkspacePlan(
      { id: input.workspaceId, name: workspace.businessName },
      adminSubscription(input, admin.email, new Date()),
      changes,
      admin,
    );
    // The page shows the new plan and the log entry.
    refresh();
    return {
      message: `${workspace.businessName} is on ${name(input.planId)} now.`,
    };
  },
);
