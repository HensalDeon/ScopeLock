/**
 * When a follow-up on WhatsApp is a reminder rather than the first send:
 * after a few days. Shared by the project page and the overview, so both
 * say "Send" or "Remind" for the same thing.
 */
export const REMIND_AFTER_DAYS = 3;

export function isReminder(since: Date, now: Date): boolean {
  return (
    now.getTime() - since.getTime() > REMIND_AFTER_DAYS * 24 * 60 * 60 * 1000
  );
}
