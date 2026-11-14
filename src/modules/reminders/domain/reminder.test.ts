import { describe, expect, it } from "vitest";
import { nextReminderAt, reminderEmail, reminderKey } from "./reminder";

const now = new Date("2026-11-10T12:00:00+05:30");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

describe("nextReminderAt", () => {
  it("allows the first reminder", () => {
    expect(nextReminderAt(null, now)).toBeNull();
  });
  it("waits a day after the last one", () => {
    expect(nextReminderAt(hoursAgo(5), now)?.toISOString()).toBe(
      new Date(hoursAgo(5).getTime() + 24 * 3_600_000).toISOString(),
    );
  });
  it("allows another after 24 hours", () => {
    expect(nextReminderAt(hoursAgo(25), now)).toBeNull();
  });
  it("waits a day after the item was sent, too", () => {
    expect(nextReminderAt(null, now, hoursAgo(2))).not.toBeNull();
    expect(nextReminderAt(null, now, hoursAgo(30))).toBeNull();
    // The later of the two decides.
    expect(nextReminderAt(hoursAgo(30), now, hoursAgo(3))?.getTime()).toBe(
      hoursAgo(3).getTime() + 24 * 3_600_000,
    );
  });
});

describe("reminderKey", () => {
  it("names the project, kind and item", () => {
    expect(reminderKey("p1", "change", "3")).toBe("p1:change:3");
  });
});

describe("reminderEmail", () => {
  const base = {
    business: "Asha Menon Studio",
    client: "Rahul",
    project: "Website redesign",
    url: "https://scopelock.example/c/abc",
  };

  it("asks for an answer on a change request", () => {
    const e = reminderEmail({
      ...base,
      kind: "change",
      item: "CR-003 SEO setup",
      amount: "₹8,000",
    });
    expect(e.subject).toBe(
      "Reminder: CR-003 SEO setup for Website redesign needs your answer",
    );
    expect(e.content.action).toEqual({ label: "Open CR-003", url: base.url });
    expect(e.content.paragraphs[0]).toContain("Hi Rahul");
  });

  it("says who is paid on a payment reminder", () => {
    const e = reminderEmail({
      ...base,
      kind: "payment",
      item: "Advance",
      amount: "₹28,320",
    });
    expect(e.subject).toBe("Reminder: ₹28,320 due for Website redesign");
    expect(e.content.footnote).toContain("You pay Asha Menon Studio directly");
  });

  it("says when an automatic one was asked for, and how to stop them", () => {
    const e = reminderEmail({
      ...base,
      kind: "payment",
      item: "Advance",
      amount: "₹28,320",
      askedOn: "18 Nov",
    });
    expect(e.content.paragraphs[0]).toBe(
      "Hi Rahul, a reminder from Asha Menon Studio: the Advance payment for Website redesign (₹28,320), asked for on 18 Nov, is still due.",
    );
    expect(e.content.footnote).toContain("If you've already paid");
  });

  it("points a proposal reminder at the proposal", () => {
    const e = reminderEmail({
      ...base,
      kind: "proposal",
      item: "the proposal",
      amount: "₹80,000",
    });
    expect(e.content.action?.label).toBe("Open the proposal");
  });
});
