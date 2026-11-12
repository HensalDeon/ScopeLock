/**
 * Automatic payment reminders (Pro and Agency). Once a payment is asked
 * for and stays unpaid, ScopeLock emails the client their pay link 3, 7 and
 * 14 days later, then stops. Days are Indian calendar days and emails go
 * only in working hours, so a client is never emailed at night.
 *
 * Never two reminders on the same day (counting the freelancer's own "Email
 * reminder"), and never the day it was asked for or marked "not received":
 * the client already had an email that day. A reported payment ("I've
 * paid") is no longer due, so reminders stop until it's due again.
 */

export const AUTO_REMINDER_DAYS = [3, 7, 14] as const;

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
/** 9 am to 8 pm, India time. */
const SENDING_HOURS = { from: 9, to: 20 } as const;

/** Which Indian calendar day a moment falls on (days since 1 Jan 1970). */
export function indiaDay(at: Date): number {
  return Math.floor((at.getTime() + IST_OFFSET_MS) / DAY_MS);
}

/** Noon of an Indian calendar day, for showing it as a date. */
export function noonOfIndiaDay(day: number): Date {
  return new Date(day * DAY_MS - IST_OFFSET_MS + 12 * HOUR_MS);
}

/** Hours since midnight, India time (0 to 24). */
function indiaHour(at: Date): number {
  return (at.getTime() + IST_OFFSET_MS - indiaDay(at) * DAY_MS) / HOUR_MS;
}

/** Reminders go only between 9 am and 8 pm, India time. */
export function isSendingHour(now: Date): boolean {
  const hour = indiaHour(now);
  return hour >= SENDING_HOURS.from && hour < SENDING_HOURS.to;
}

export type AutoReminderState = {
  requestedAt: Date;
  /** When it last became due: asked for, or marked "not received". */
  dueSince: Date;
  /** Automatic reminders sent so far, oldest first. */
  sent: readonly Date[];
  /** The freelancer paused them for this payment, with no end date. */
  paused: boolean;
  /** Paused until this day ("I'll pay on Friday"): none goes before it. */
  pausedUntil?: Date | null;
};

/** "2026-11-20" (a date input's value) → that Indian calendar day. */
export function indiaDayOfIsoDate(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const utc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const day = utc / DAY_MS;
  // Rejects 2026-02-31 and the like, which Date.UTC rolls over.
  return new Date(utc).getUTCDate() === Number(m[3]) ? day : null;
}

/** An Indian calendar day as a date input's value ("2026-11-20"). */
export function isoDateOfIndiaDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** How far ahead a pause can be set: a client's promised date, not a plan. */
export const PAUSE_UNTIL_MAX_DAYS = 60;

/**
 * The Indian calendar day the next automatic reminder goes, or null when
 * no more will (paused, or all three sent). `lastManual` is the
 * freelancer's own latest "Email reminder" about it.
 */
export function nextAutoReminderDay(
  state: AutoReminderState,
  lastManual: Date | null,
): number | null {
  if (state.paused) return null;
  const after = AUTO_REMINDER_DAYS[state.sent.length];
  if (after === undefined) return null;
  const lastEmail = Math.max(
    ...[state.dueSince, lastManual, ...state.sent]
      .filter((d): d is Date => d !== null)
      .map(indiaDay),
  );
  return Math.max(
    indiaDay(state.requestedAt) + after,
    lastEmail + 1,
    state.pausedUntil ? indiaDay(state.pausedUntil) : 0,
  );
}

/** Whether the daily run should email this one now. */
export function isAutoReminderDue(
  state: AutoReminderState,
  lastManual: Date | null,
  now: Date,
): boolean {
  const day = nextAutoReminderDay(state, lastManual);
  return day !== null && indiaDay(now) >= day && isSendingHour(now);
}

/** What the freelancer sees under a due payment. */
export type AutoReminderView =
  /** Not on this plan: nothing is shown. */
  | { kind: "none" }
  | { kind: "off" }
  | { kind: "no_email" }
  | { kind: "paused"; sent: number }
  | {
      kind: "next";
      on: Date | "today";
      sent: number;
      /** Held back by "pause until": the date it resumes. */
      heldUntil: Date | null;
    }
  | { kind: "done"; sent: number; last: Date };

export function autoReminderView(input: {
  /** The workspace's plan includes automatic reminders. */
  included: boolean;
  /** Settings → Payments: automatic reminders on. */
  on: boolean;
  clientHasEmail: boolean;
  state: AutoReminderState;
  lastManual: Date | null;
  now: Date;
}): AutoReminderView {
  const { state } = input;
  if (!input.included) return { kind: "none" };
  if (!input.on) return { kind: "off" };
  if (!input.clientHasEmail) return { kind: "no_email" };
  const sent = state.sent.length;
  if (state.paused) return { kind: "paused", sent };
  const day = nextAutoReminderDay(state, input.lastManual);
  if (day === null) {
    const last = state.sent[sent - 1];
    return last ? { kind: "done", sent, last } : { kind: "none" };
  }
  // After 8 pm today's run is over: the earliest is tomorrow.
  const today = indiaDay(input.now);
  const earliest = indiaHour(input.now) >= SENDING_HOURS.to ? today + 1 : today;
  const on = Math.max(day, earliest);
  const until = state.pausedUntil ? indiaDay(state.pausedUntil) : null;
  return {
    kind: "next",
    on: on === today ? "today" : noonOfIndiaDay(on),
    sent,
    heldUntil: until !== null && until > today ? noonOfIndiaDay(until) : null,
  };
}
