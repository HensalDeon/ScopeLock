"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { workspaceAction } from "@/modules/workspace/server";
import { formatDate } from "@/shared/lib/dates";
import { UserError } from "@/shared/lib/form-state";
import {
  indiaDay,
  indiaDayOfIsoDate,
  noonOfIndiaDay,
  PAUSE_UNTIL_MAX_DAYS,
} from "../domain/auto-reminders";
import { idField } from "./action-helpers";
import { setAutoRemindersPaused } from "./reminder-repository";
import { saveAutoRemindersOn } from "./settings-repository";

/** Project page: pause (until a day, or with no end) or resume one payment. */
export const setPaymentAutoReminders = workspaceAction(
  {
    fields: ["projectId", "paymentId", "paused", "until"] as const,
    schema: z.object({
      projectId: idField("project"),
      paymentId: idField("payment"),
      paused: z.enum(["true", "false"]).transform((v) => v === "true"),
      /** "2026-11-27" from the date field; empty: no end date. */
      until: z.string().max(10).optional().default(""),
    }),
    failureMessage: "That didn't save. Please try again.",
  },
  async ({ projectId, paymentId, paused, until }, { workspace }) => {
    let untilDay: number | null = null;
    if (paused && until) {
      untilDay = indiaDayOfIsoDate(until);
      const today = indiaDay(new Date());
      if (
        untilDay === null ||
        untilDay <= today ||
        untilDay > today + PAUSE_UNTIL_MAX_DAYS
      )
        throw new UserError(
          `Pick a date from tomorrow up to ${PAUSE_UNTIL_MAX_DAYS} days ahead, or pause with no end date.`,
        );
    }
    const ok = await setAutoRemindersPaused(
      workspace.workspaceId,
      projectId,
      paymentId,
      {
        paused,
        until: untilDay === null ? null : noonOfIndiaDay(untilDay),
      },
    );
    if (!ok)
      throw new UserError(
        "This payment isn't waiting on the client any more. Refresh the page.",
      );
    refresh();
    return {
      message:
        untilDay !== null
          ? `Automatic reminders paused until ${formatDate(noonOfIndiaDay(untilDay))}.`
          : paused
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
