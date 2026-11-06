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

const isoDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Whole calendar days between two moments, in India time. */
function daysBetween(earlier: Date, later: Date): number {
  const day = (d: Date) => Date.parse(`${isoDay.format(d)}T00:00:00Z`);
  return Math.round((day(later) - day(earlier)) / 86_400_000);
}

/**
 * "today", "yesterday", "3 days ago"; after a week the date ("18 Nov").
 * For "sent …" and "waiting since …" lines.
 */
export function formatAgo(date: Date, { now = new Date() } = {}): string {
  const days = daysBetween(date, now);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return `on ${formatDate(date, { now })}`;
}

/** Today's date in India as "2026-11-07" (for date inputs and checks). */
export function todayInIndia(now: Date = new Date()): string {
  return isoDay.format(now);
}

/** A stored calendar date ("2026-11-07") as "7 Nov" (or "7 Nov 2025"). */
export function formatIsoDate(iso: string, options?: { now?: Date }): string {
  return formatDate(new Date(`${iso}T12:00:00+05:30`), options);
}
