import type { Route } from "next";
import Link from "next/link";
import { formatDate } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";
import { TOUCH_LINK } from "@/shared/ui/touch";
import { autoReminderView } from "../domain/auto-reminders";
import type { Payment } from "../domain/payment";
import { setPaymentAutoReminders } from "../server/reminder-actions";
import { Run } from "./run-action";
import type { ScheduleRowContext } from "./schedule-row";

const LINK = cn(
  "font-medium text-foreground underline underline-offset-4",
  TOUCH_LINK,
);

const times = (n: number) =>
  n === 1 ? "1 automatic reminder" : `${n} automatic reminders`;

/**
 * Under a payment that's due (Pro, Agency): when ScopeLock emails the
 * client next, with Pause / Resume for this payment. Nothing on Free.
 */
export function AutoReminderLine({
  payment,
  ctx,
}: {
  payment: Payment;
  ctx: ScheduleRowContext;
}) {
  const auto = ctx.autoReminders;
  if (!auto || payment.status !== "due") return null;
  const now = ctx.now ?? new Date();
  const view = autoReminderView({
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
    now,
  });
  const date = (d: Date) => formatDate(d, { now });
  const toggle = (paused: boolean) =>
    ctx.readOnly ? null : (
      <Run
        action={setPaymentAutoReminders}
        fields={{
          projectId: ctx.projectId,
          paymentId: payment.id,
          paused: String(paused),
        }}
        label={paused ? "Pause" : "Resume"}
        pendingLabel={paused ? "Pausing…" : "Resuming…"}
        variant="link"
        className="h-auto px-0 font-medium text-foreground underline max-sm:h-11"
      />
    );

  let text: React.ReactNode;
  let action: React.ReactNode = null;
  switch (view.kind) {
    case "none":
      return null;
    case "off":
      text = (
        <>
          Automatic reminders are off.{" "}
          <Link href="/settings/payments#reminders" className={LINK}>
            Turn them on
          </Link>
        </>
      );
      break;
    case "no_email":
      text = (
        <>
          No automatic reminders: {ctx.client.firstName} has no email saved.{" "}
          {auto.clientHref && (
            <Link href={auto.clientHref as Route} className={LINK}>
              Add their email
            </Link>
          )}
        </>
      );
      break;
    case "paused":
      text = `Automatic reminders paused${view.sent ? ` after ${times(view.sent)}` : ""}.`;
      action = toggle(false);
      break;
    case "next":
      text = `${view.sent ? `${times(view.sent)} sent. Next` : "Automatic reminder"} by email ${
        view.on === "today" ? "today" : `on ${date(view.on)}`
      }.`;
      action = toggle(true);
      break;
    case "done":
      text = `${times(view.sent)} sent, the last on ${date(view.last)}. No more go out on their own.`;
      break;
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 text-sm text-pretty text-muted-foreground tabular-nums">
      <p>{text}</p>
      {action}
    </div>
  );
}
