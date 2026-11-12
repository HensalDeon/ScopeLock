"use client";

import Link from "next/link";
import { useActionState, useOptimistic, useTransition } from "react";
import { reminderEmail } from "@/modules/reminders";
import { IDLE, type FormState } from "@/shared/lib/form-state";
import { cn } from "@/shared/lib/utils";
import { Switch } from "@/shared/ui/switch";
import { TOUCH_LINK } from "@/shared/ui/touch";
import { AUTO_REMINDER_DAYS } from "../domain/auto-reminders";
import { setAutoReminders } from "../server/reminder-actions";

const DAYS = `${AUTO_REMINDER_DAYS.slice(0, -1).join(", ")} and ${AUTO_REMINDER_DAYS.at(-1)}`;
const LINK = cn("font-medium underline underline-offset-4", TOUCH_LINK);

/** The section's left column, beside the switch. */
export const AUTO_REMINDERS_SUMMARY = `Emails a client about an unpaid payment ${DAYS} days after you ask, until they pay.`;

/**
 * Settings → Payments: automatic reminders for every payment, on or off,
 * with the rules and the email itself. On Free it says what they do and
 * where to get them.
 */
export function AutoRemindersSetting({
  included,
  on,
  canChange,
  businessName,
}: {
  /** The plan includes them (Pro, Agency). */
  included: boolean;
  on: boolean;
  canChange: boolean;
  businessName: string;
}) {
  const [state, action] = useActionState<FormState<"on">, FormData>(
    setAutoReminders,
    IDLE,
  );
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(on);

  const rules = (
    <ul className="grid max-w-prose gap-1 text-sm text-pretty text-muted-foreground">
      <li>
        Sent to the client&apos;s email with their pay link, between 9 am and 8
        pm India time.
      </li>
      <li>
        Never two in one day, counting any reminder you send yourself. Sending
        one yourself counts as the next of the three.
      </li>
      <li>
        Stops once they pay or tap &ldquo;I&apos;ve paid&rdquo;. Pause it for
        one payment on its project page.
      </li>
    </ul>
  );

  if (!included)
    return (
      <div className="grid gap-3">
        {rules}
        <p className="text-sm">
          On Pro and Agency.{" "}
          <Link href="/settings/plan" className={LINK}>
            See plans
          </Link>
        </p>
      </div>
    );

  return (
    <div className="grid gap-4">
      {canChange ? (
        <div className="grid gap-1">
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
            Email clients when a payment is still unpaid
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
                ? "Saves as soon as you switch it."
                : (state.message ?? "")}
          </p>
        </div>
      ) : (
        <p className="text-sm">
          {on
            ? "On for this workspace. Only the owner or an admin can turn them off."
            : "Off for this workspace. Only the owner or an admin can turn them on."}
        </p>
      )}
      {rules}
      <EmailPreview businessName={businessName} />
    </div>
  );
}

/** What the client receives, with example details. */
function EmailPreview({ businessName }: { businessName: string }) {
  const { subject, content } = reminderEmail({
    kind: "payment",
    business: businessName,
    client: "Rahul",
    project: "Website redesign",
    item: "Advance",
    amount: "₹24,000",
    url: "",
    askedOn: "10 Nov",
  });
  return (
    <details className="text-sm">
      <summary
        className={cn(
          "w-fit cursor-pointer font-medium underline underline-offset-4",
          TOUCH_LINK,
        )}
      >
        See the email your client gets
      </summary>
      <div className="mt-3 grid max-w-prose gap-2 rounded-lg border bg-background p-4">
        <p className="text-muted-foreground">
          Example, for a client called Rahul
        </p>
        <p className="font-medium">{subject}</p>
        {content.paragraphs.map((text) => (
          <p key={text} className="text-pretty">
            {text}
          </p>
        ))}
        <p className="font-medium">[{content.action?.label}]</p>
        {content.footnote && (
          <p className="text-pretty text-muted-foreground">
            {content.footnote}
          </p>
        )}
      </div>
    </details>
  );
}
