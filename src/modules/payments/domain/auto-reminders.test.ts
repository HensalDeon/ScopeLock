import { describe, expect, it } from "vitest";
import {
  autoReminderView,
  indiaDay,
  indiaDayOfIsoDate,
  isoDateOfIndiaDay,
  isAutoReminderDue,
  isSendingHour,
  nextAutoReminderDay,
  noonOfIndiaDay,
  type AutoReminderState,
} from "./auto-reminders";

/** A moment in India time: "2026-11-18 15:42". */
const ist = (s: string) => new Date(`${s.replace(" ", "T")}:00+05:30`);
const day = (s: string) => indiaDay(ist(`${s} 12:00`));

const asked = ist("2026-11-18 15:42");
const state = (over: Partial<AutoReminderState> = {}): AutoReminderState => ({
  requestedAt: asked,
  dueSince: asked,
  sent: [],
  paused: false,
  ...over,
});

describe("indiaDay", () => {
  it("counts days on the Indian calendar, not UTC", () => {
    // 1 am IST on the 19th is still the 18th in UTC.
    expect(indiaDay(ist("2026-11-19 01:00"))).toBe(day("2026-11-19"));
    expect(indiaDay(ist("2026-11-18 23:59"))).toBe(day("2026-11-18"));
    expect(indiaDay(noonOfIndiaDay(day("2026-11-21")))).toBe(day("2026-11-21"));
  });
});

describe("isSendingHour", () => {
  it("is 9 am to 8 pm, India time", () => {
    expect(isSendingHour(ist("2026-11-21 08:59"))).toBe(false);
    expect(isSendingHour(ist("2026-11-21 09:00"))).toBe(true);
    expect(isSendingHour(ist("2026-11-21 10:30"))).toBe(true);
    expect(isSendingHour(ist("2026-11-21 19:59"))).toBe(true);
    expect(isSendingHour(ist("2026-11-21 20:00"))).toBe(false);
    expect(isSendingHour(ist("2026-11-21 03:00"))).toBe(false);
  });
});

describe("nextAutoReminderDay", () => {
  it("goes 3, 7 and 14 days after it was asked for, then stops", () => {
    expect(nextAutoReminderDay(state(), null)).toBe(day("2026-11-21"));
    const first = ist("2026-11-21 10:30");
    expect(nextAutoReminderDay(state({ sent: [first] }), null)).toBe(
      day("2026-11-25"),
    );
    const second = ist("2026-11-25 10:30");
    expect(nextAutoReminderDay(state({ sent: [first, second] }), null)).toBe(
      day("2026-12-02"),
    );
    const third = ist("2026-12-02 10:30");
    expect(
      nextAutoReminderDay(state({ sent: [first, second, third] }), null),
    ).toBeNull();
  });

  it("is never on the same day as the freelancer's own reminder", () => {
    expect(nextAutoReminderDay(state(), ist("2026-11-21 09:15"))).toBe(
      day("2026-11-22"),
    );
    // An older manual reminder doesn't move it.
    expect(nextAutoReminderDay(state(), ist("2026-11-19 09:15"))).toBe(
      day("2026-11-21"),
    );
  });

  it("waits a day after the payment is due again (marked not received)", () => {
    const again = ist("2026-11-24 18:00");
    expect(nextAutoReminderDay(state({ dueSince: again }), null)).toBe(
      day("2026-11-25"),
    );
  });

  it("spaces them out after a missed day instead of sending two at once", () => {
    // The first went late, on the 8th day: the second waits a day.
    const late = ist("2026-11-26 10:30");
    expect(nextAutoReminderDay(state({ sent: [late] }), null)).toBe(
      day("2026-11-27"),
    );
  });

  it("waits until a paused-until date, then carries on by itself", () => {
    const friday = noonOfIndiaDay(day("2026-11-27"));
    expect(nextAutoReminderDay(state({ pausedUntil: friday }), null)).toBe(
      day("2026-11-27"),
    );
    // A date already passed changes nothing.
    const past = noonOfIndiaDay(day("2026-11-19"));
    expect(nextAutoReminderDay(state({ pausedUntil: past }), null)).toBe(
      day("2026-11-21"),
    );
  });

  it("sends none while paused", () => {
    expect(nextAutoReminderDay(state({ paused: true }), null)).toBeNull();
  });
});

describe("isAutoReminderDue", () => {
  it("is due on its day, in working hours only", () => {
    expect(isAutoReminderDue(state(), null, ist("2026-11-20 10:30"))).toBe(
      false,
    );
    expect(isAutoReminderDue(state(), null, ist("2026-11-21 10:30"))).toBe(
      true,
    );
    expect(isAutoReminderDue(state(), null, ist("2026-11-21 21:00"))).toBe(
      false,
    );
    // A missed run catches up on a later day.
    expect(isAutoReminderDue(state(), null, ist("2026-11-23 10:30"))).toBe(
      true,
    );
  });
});

describe("autoReminderView", () => {
  const base = {
    included: true,
    on: true,
    clientHasEmail: true,
    state: state(),
    lastManual: null,
    now: ist("2026-11-19 11:00"),
  };

  it("shows nothing on a plan without them", () => {
    expect(autoReminderView({ ...base, included: false })).toEqual({
      kind: "none",
    });
  });

  it("says when they're off, or the client has no email", () => {
    expect(autoReminderView({ ...base, on: false }).kind).toBe("off");
    expect(autoReminderView({ ...base, clientHasEmail: false }).kind).toBe(
      "no_email",
    );
  });

  it("gives the date of the next one", () => {
    expect(autoReminderView(base)).toEqual({
      kind: "next",
      on: noonOfIndiaDay(day("2026-11-21")),
      sent: 0,
      heldUntil: null,
    });
  });

  it("says today on the day, and tomorrow once today's hours are over", () => {
    const on21 = { ...base, now: ist("2026-11-21 08:00") };
    expect(autoReminderView(on21)).toMatchObject({ on: "today" });
    const late = { ...base, now: ist("2026-11-21 20:30") };
    expect(autoReminderView(late)).toMatchObject({
      on: noonOfIndiaDay(day("2026-11-22")),
    });
  });

  it("says when a pause until a date ends", () => {
    const friday = noonOfIndiaDay(day("2026-11-27"));
    expect(
      autoReminderView({ ...base, state: state({ pausedUntil: friday }) }),
    ).toEqual({ kind: "next", on: friday, sent: 0, heldUntil: friday });
  });

  it("reports paused and finished", () => {
    const one = [ist("2026-11-21 10:30")];
    expect(
      autoReminderView({ ...base, state: state({ sent: one, paused: true }) }),
    ).toEqual({ kind: "paused", sent: 1 });
    const all = [
      ist("2026-11-21 10:30"),
      ist("2026-11-25 10:30"),
      ist("2026-12-02 10:30"),
    ];
    expect(autoReminderView({ ...base, state: state({ sent: all }) })).toEqual({
      kind: "done",
      sent: 3,
      last: all[2],
    });
  });
});

describe("indiaDayOfIsoDate", () => {
  it("reads a date input's value as an Indian calendar day, and back", () => {
    expect(indiaDayOfIsoDate("2026-11-27")).toBe(day("2026-11-27"));
    expect(isoDateOfIndiaDay(day("2026-11-27"))).toBe("2026-11-27");
    expect(indiaDayOfIsoDate("2026-02-31")).toBeNull();
    expect(indiaDayOfIsoDate("27/11/2026")).toBeNull();
  });
});
