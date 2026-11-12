"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { workspaceAction } from "@/modules/workspace/server";
import { UserError } from "@/shared/lib/form-state";
import { idField } from "./action-helpers";
import { setAutoRemindersPaused } from "./reminder-repository";
import { saveAutoRemindersOn } from "./settings-repository";

/** Project page: pause or resume automatic reminders for one payment. */
export const setPaymentAutoReminders = workspaceAction(
  {
    fields: ["projectId", "paymentId", "paused"] as const,
    schema: z.object({
      projectId: idField("project"),
      paymentId: idField("payment"),
      paused: z.enum(["true", "false"]).transform((v) => v === "true"),
    }),
    failureMessage: "That didn't save. Please try again.",
  },
  async ({ projectId, paymentId, paused }, { workspace }) => {
    const ok = await setAutoRemindersPaused(
      workspace.workspaceId,
      projectId,
      paymentId,
      paused,
    );
    if (!ok)
      throw new UserError(
        "This payment isn't waiting on the client any more. Refresh the page.",
      );
    refresh();
    return {
      message: paused
        ? "Automatic reminders paused for this payment."
        : "Automatic reminders are back on for this payment.",
    };
  },
);

/** Settings → Payments: automatic reminders for every payment, on or off. */
export const setAutoReminders = workspaceAction(
  {
    fields: ["on"] as const,
    schema: z.object({
      on: z.enum(["true", "false"]).transform((v) => v === "true"),
    }),
    roles: ["owner", "admin"],
    failureMessage: "That didn't save. Please try again.",
  },
  async ({ on }, { workspace }) => {
    await saveAutoRemindersOn(workspace.workspaceId, on);
    refresh();
    return {
      message: on
        ? "Automatic reminders are on."
        : "Automatic reminders are off. Nothing goes out unless you send it.",
    };
  },
);
