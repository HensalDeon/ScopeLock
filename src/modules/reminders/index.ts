/**
 * Reminders module: public, client-safe API. Email reminders to clients
 * for things waiting on them (a proposal, a change request, a payment).
 */
export { EmailReminderButton } from "./ui/email-reminder-button";
export {
  nextReminderAt,
  reminderKey,
  REMINDER_KINDS,
  type ReminderKind,
} from "./domain/reminder";
