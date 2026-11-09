import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import { isReminder, nextStep, stillToAsk } from "./next-step";
import type { ScheduleItem } from "./payment";

const item = (key: string, state: ScheduleItem["state"], payable = 1000) =>
  ({
    key,
    state,
    total: minor(payable),
    tax: minor(0),
    payable: minor(payable),
  }) as ScheduleItem;

describe("nextStep", () => {
  it("money the client says they sent comes first", () => {
    const step = nextStep([
      item("adv", "received"),
      item("design", "due"),
      item("launch", "client_reported"),
    ]);
    expect(step).toMatchObject({ kind: "confirm", item: { key: "launch" } });
  });

  it("then a request that's out, then the next payment to ask for", () => {
    expect(
      nextStep([item("adv", "received"), item("design", "due")]),
    ).toMatchObject({ kind: "waiting", item: { key: "design" } });
    expect(
      nextStep([
        item("adv", "received"),
        item("design", "upcoming"),
        item("launch", "upcoming"),
      ]),
    ).toMatchObject({ kind: "ask", item: { key: "design" } });
  });

  it("all paid: settled; no payments: nothing", () => {
    expect(nextStep([item("adv", "received")])).toEqual({ kind: "settled" });
    expect(nextStep([])).toBeNull();
  });
});

describe("stillToAsk", () => {
  it("adds up what hasn't been asked for, GST included", () => {
    expect(
      stillToAsk([
        item("adv", "received", 3_398_400),
        item("design", "upcoming", 3_398_400),
        item("launch", "upcoming", 6_301_200),
      ]),
    ).toBe(9_699_600);
  });
});

describe("isReminder", () => {
  it("the first few days are a first send, after that a reminder", () => {
    const asked = new Date("2026-11-09T10:00:00+05:30");
    expect(isReminder(asked, new Date("2026-11-11T10:00:00+05:30"))).toBe(
      false,
    );
    expect(isReminder(asked, new Date("2026-11-13T10:00:00+05:30"))).toBe(true);
  });
});
