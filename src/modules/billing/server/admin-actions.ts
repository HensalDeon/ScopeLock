"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/modules/admin/server";
import { UserError } from "@/shared/lib/form-state";
import {
  completePlans,
  planChanges,
  planFromInput,
  planInputSchema,
} from "../domain/plans";
import { PLANS_TAG } from "./queries";
import { savePlanChange } from "./plan-changes";
import * as repo from "./repository";

/** The plan form sends one JSON field (lists and switches included). */
const payloadSchema = z
  .object({ payload: z.string().max(8_000) })
  .transform((v, ctx) => {
    try {
      return JSON.parse(v.payload) as unknown;
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "That form didn't send properly.",
      });
      return z.NEVER;
    }
  })
  .pipe(planInputSchema);

/** Admin: save a plan. A changed price is added to its history. */
export const savePlan = adminAction(
  { fields: ["payload"] as const, schema: payloadSchema },
  async (input, admin) => {
    const before = completePlans(await repo.findPlans()).find(
      (p) => p.id === input.id,
    );
    if (!before) throw new UserError("That plan doesn't exist.");
    const after = planFromInput(input);
    const changes = planChanges(before, after);
    if (changes.length === 0) return { message: "Nothing changed." };

    await savePlanChange(before, after, changes, admin);
    // The site (landing, pricing, limits) shows the new plan straight away.
    updateTag(PLANS_TAG);
    return { message: `${after.name} saved: ${changes.join("; ")}.` };
  },
);
