import type { Route } from "next";
import Link from "next/link";
import { EmailReminderButton, nextReminderAt } from "@/modules/reminders";
import { formatDate, formatDateTime } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";
import { TOUCH_LINK } from "@/shared/ui/touch";
import {
  AUTO_REMINDER_DAYS,
  autoReminderView,
  type AutoReminderView,
} from "../domain/auto-reminders";
import type { Payment } from "../domain/payment";
import { setPaymentAutoReminders } from "../server/reminder-actions";
import { Run } from "./run-action";
import type { ScheduleRowContext } from "./schedule-row";

const LINK = cn(
  "font-medium text-foreground underline underline-offset-4",
  TOUCH_LINK,
);
const INLINE_ACTION =
  "h-auto px-0 font-medium text-foreground underline max-sm:h-11 max-sm:px-0";
const OF = AUTO_REMINDER_DAYS.length;

/** Where this payment's automatic reminders stand. */
export function autoViewOf(
  payment: Payment,
  ctx: ScheduleRowContext,
): AutoReminderView {
  const auto = ctx.autoReminders;
  if (!auto || payment.status !== "due") return { kind: "none" };
  return autoReminderView({
    included: auto.included,
    on: auto.on,
    clientHasEmail: Boolean(ctx.client.email),
    state: {
      requestedAt: payment.requestedAt,
      dueSince: payment.dueSince,
      sent: payment.autoReminders.sent,
      paused: payment.autoReminders.paused,
    },
    lastManual: auto.lastManual[payment.id] ?? null,
    now: ctx.now ?? new Date(),
  });
}

/**
 * Under a payment that's due (Pro, Agency): which of the three automatic
 * emails goes next and when, with "Send it now" (counts as that one) and
 * Pause / Resume. Nothing on Free.
 */
export function AutoReminderLine({
  payment,
  ctx,
  inStrip = false,
}: {
  payment: Payment;
  ctx: ScheduleRowContext;
  /**
   * The money strip: also says when they're off or can't go, and offers
   * "Send it now". Payment rows show only the schedule itself.
   */
  inStrip?: boolean;
}) {
  const auto = ctx.autoReminders;
  if (!auto || payment.status !== "due") return null;
  const now = ctx.now ?? new Date();
  const lastManual = auto.lastManual[payment.id] ?? null;
  const view = autoViewOf(payment, ctx);
  const id = `auto-${payment.id}`;
  const name = ctx.client.firstName;
  const date = (d: Date) => formatDate(d, { now });
  const toggle = (paused: boolean) =>
    ctx.readOnly ? null : (
      <Run
        key={paused ? "pause" : "resume"}
        action={setPaymentAutoReminders}
        fields={{
          projectId: ctx.projectId,
          paymentId: payment.id,
          paused: String(paused),
        }}
        label={paused ? "Pause" : "Resume"}
        pendingLabel={paused ? "Pausing…" : "Resuming…"}
        variant="link"
        className={INLINE_ACTION}
        focusId={id}
      />
    );

  let text: React.ReactNode;
  const actions: React.ReactNode[] = [];
  switch (view.kind) {
    case "none":
      return null;
    case "off":
      if (!inStrip) return null;
      text = (
        <>
          Automatic reminders are off.{" "}
          <Link href="/settings/payments#reminders" className={LINK}>
            Settings
          </Link>
        </>
      );
      break;
    case "no_email":
      if (!inStrip) return null;
      text = (
        <>
          No automatic reminders: {name} has no email saved.{" "}
          {auto.clientHref && (
            <Link href={auto.clientHref as Route} className={LINK}>
              Add their email
            </Link>
          )}
        </>
      );
      break;
    case "paused":
      text = view.sent
        ? `Automatic reminders paused after ${view.sent} of ${OF}.`
        : "Automatic reminders paused.";
      actions.push(toggle(false));
      break;
    case "next": {
      const when = view.on === "today" ? "today" : `on ${date(view.on)}`;
      text = `Reminder ${view.sent + 1} of ${OF} goes to ${name} by email ${when}.`;
      if (inStrip && !ctx.readOnly) {
        // Same once-a-day rule as everywhere: hidden while none can go.
        const wait = nextReminderAt(lastManual, now, payment.requestedAt);
        actions.push(
          <EmailReminderButton
            key="now"
            projectId={ctx.projectId}
            kind="payment"
            refId={payment.id}
            look="link"
            sentLabel={wait ? formatDateTime(wait, { now }) : null}
          />,
        );
      }
      actions.push(toggle(true));
      break;
    }
    case "done":
      text = `All ${OF} automatic reminders sent, the last on ${date(view.last)}. If it's still unpaid, send one yourself or call ${name}.`;
      break;
  }
  return (
    <div
      id={id}
      tabIndex={-1}
      className="flex flex-wrap items-center gap-x-4 text-sm text-pretty text-muted-foreground tabular-nums outline-none"
    >
      <p>{text}</p>
      {actions}
    </div>
  );
}
