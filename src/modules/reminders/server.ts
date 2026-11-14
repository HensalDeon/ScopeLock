/**
 * Reminders module: server-only API. The daily run of automatic payment
 * reminders (called by the cron route).
 */
import "server-only";

export { runAutoReminders, type AutoReminderRun } from "./server/auto";
