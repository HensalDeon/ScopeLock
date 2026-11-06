/**
 * Dates as Indian users read them, always in India time (servers run in UTC):
 * "18 Nov, 3:42 pm", "18 Nov 2026". The year is shown only when it isn't the
 * current one, unless asked for.
 */
const TIME_ZONE = "Asia/Kolkata";

const dayMonth = new Intl.DateTimeFormat("en-IN", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
});
const dayMonthYear = new Intl.DateTimeFormat("en-IN", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});
const time = new Intl.DateTimeFormat("en-IN", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const yearOnly = new Intl.DateTimeFormat("en-IN", {
  timeZone: TIME_ZONE,
  year: "numeric",
});

function sameYear(a: Date, b: Date): boolean {
  return yearOnly.format(a) === yearOnly.format(b);
}

/** "18 Nov" this year, "18 Nov 2025" otherwise. */
export function formatDate(
  date: Date,
  { now = new Date(), withYear = false } = {},
): string {
  return (withYear || !sameYear(date, now) ? dayMonthYear : dayMonth).format(
    date,
  );
}

/** "18 Nov, 3:42 pm" (lowercase am/pm, as written in India). */
export function formatDateTime(date: Date, options?: { now?: Date }): string {
  return `${formatDate(date, options)}, ${time.format(date).toLowerCase()}`;
}
