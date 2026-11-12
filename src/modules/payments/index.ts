/**
 * Payments module: public, client-safe API.
 */
export {
  hasAnyMethod,
  METHOD_KINDS,
  METHOD_LABELS,
  methodsFormValues,
  methodsInputSchema,
  type MethodKind,
  type PaymentMethods,
} from "./domain/methods";
export {
  closedKeys,
  lineBreakdown,
  type Payment,
  type ScheduleItem,
  type ScheduleState,
} from "./domain/payment";
export {
  CLIENT_PAYMENT_LABELS,
  PAYMENT_STATE_LABELS,
  REPORT_FIELDS,
  reportInputSchema,
  type ReportField,
} from "./domain/payment-forms";
export type { ScheduleTotals } from "./domain/gst";
export {
  AUTO_REMINDER_DAYS,
  autoReminderView,
  isAutoReminderDue,
  isSendingHour,
  type AutoReminderView,
} from "./domain/auto-reminders";
export { nextStep, stillToAsk, type NextStep } from "./domain/next-step";
export { PaymentMethodsForm } from "./ui/methods-form";
export { AutoRemindersSetting } from "./ui/auto-reminders-setting";
export { PaymentStateBadge, PaymentsPanel } from "./ui/payments-panel";
export { ProjectMoneyStrip } from "./ui/project-money-strip";
export type { ScheduleRowContext } from "./ui/schedule-row";
export { HowToPay } from "./ui/how-to-pay";
