"use client";

import Link from "next/link";
import { useActionState, useOptimistic, useTransition } from "react";
import { IDLE, type FormState } from "@/shared/lib/form-state";
import { cn } from "@/shared/lib/utils";
import { Switch } from "@/shared/ui/switch";
import { TOUCH_LINK } from "@/shared/ui/touch";
import { AUTO_REMINDER_DAYS } from "../domain/auto-reminders";
import { setAutoReminders } from "../server/reminder-actions";

const DAYS = `${AUTO_REMINDER_DAYS.slice(0, -1).join(", ")} and ${AUTO_REMINDER_DAYS.at(-1)}`;

/**
 * Settings → Payments: automatic reminders for every payment, on or off.
 * On Free it says what they do and where to get them.
 */
export function AutoRemindersSetting({
  included,
  on,
}: {
  /** The plan includes them (Pro, Agency). */
  included: boolean;
  on: boolean;
}) {
  const [state, action] = useActionState<FormState<"on">, FormData>(
    setAutoReminders,
    IDLE,
  );
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(on);

  const explainer = (
    <p className="text-sm text-pretty text-muted-foreground">
      When a payment you asked for is still unpaid, ScopeLock emails your client
      their pay link {DAYS} days later, between 9 am and 8 pm. It stops once
      they pay or say they&apos;ve paid. You can pause it for any payment on its
      project page.
    </p>
  );

  if (!included)
    return (
      <div className="grid gap-3">
        {explainer}
        <p className="text-sm">
          On Pro and Agency.{" "}
          <Link
            href="/settings/plan"
            className={cn(
              "font-medium underline underline-offset-4",
              TOUCH_LINK,
            )}
          >
            See plans
          </Link>
        </p>
      </div>
    );

  return (
    <div className="grid gap-3">
      {explainer}
      <label className="flex w-fit items-center gap-3 text-sm font-medium max-sm:min-h-11">
        <Switch
          checked={shown}
          disabled={pending}
          onCheckedChange={(next) =>
            startTransition(() => {
              setShown(next);
              const data = new FormData();
              data.set("on", String(next));
              action(data);
            })
          }
        />
        Email clients about unpaid payments
      </label>
      <p
        role="status"
        className={cn(
          "text-sm",
          state.status === "error"
            ? "text-destructive"
            : "text-muted-foreground",
        )}
      >
        {pending
          ? "Saving…"
          : state.status === "idle"
            ? ""
            : (state.message ?? "")}
      </p>
    </div>
  );
}
