import { describe, expect, it } from "vitest";
import {
  describeActivity,
  isClientVisible,
  type ActivityEvent,
} from "./activity";

const at = new Date("2026-11-06T08:00:00Z");
const me = { kind: "member", userId: "u1", name: "Hensal Deon" } as const;
const rahul = {
  kind: "client",
  name: "Rahul Mehta",
  email: "rahul@mehta.in",
} as const;
const ev = (e: Partial<ActivityEvent>): ActivityEvent => ({
  id: "e",
  projectId: "p",
  type: "project.created",
  at,
  actor: me,
  data: {},
  ...e,
});
const cr = {
  label: "CR-001",
  title: "Blog + WhatsApp button",
  amount: 1_500_000,
  currency: "INR" as const,
};

describe("describeActivity", () => {
  it("says 'You' to the member who did it, their name to others", () => {
    const sent = ev({ type: "change.sent", data: cr });
    expect(describeActivity(sent, { kind: "member", userId: "u1" }).text).toBe(
      "You sent CR-001 Blog + WhatsApp button (₹15,000)",
    );
    expect(describeActivity(sent, { kind: "member", userId: "u2" }).text).toBe(
      "Hensal Deon sent CR-001 Blog + WhatsApp button (₹15,000)",
    );
  });

  it("names the business to the client", () => {
    expect(
      describeActivity(ev({ type: "change.sent", data: cr }), {
        kind: "client",
        businessName: "Deon Digital",
      }).text,
    ).toBe("Deon Digital sent CR-001 Blog + WhatsApp button to you (₹15,000)");
  });

  it("quotes the client's note and colours approvals", () => {
    const line = describeActivity(
      ev({
        type: "change.approved",
        actor: rahul,
        data: { ...cr, comment: "Go ahead" },
      }),
      { kind: "member", userId: "u1" },
    );
    expect(line).toEqual({
      text: "Rahul Mehta approved CR-001 Blog + WhatsApp button (₹15,000)",
      quote: "Go ahead",
      tone: "done",
    });
  });

  it("keeps internal events away from the client", () => {
    expect(isClientVisible("link.replaced")).toBe(false);
    expect(isClientVisible("change.created")).toBe(false);
    expect(isClientVisible("project.created")).toBe(false);
    expect(isClientVisible("change.approved")).toBe(true);
  });

  it("words payment events for each side", () => {
    const due = ev({
      type: "payment.requested",
      data: { title: "Before launch", amount: 4_700_000, currency: "INR" },
    });
    expect(describeActivity(due, { kind: "member", userId: "u1" }).text).toBe(
      "You asked for the Before launch payment (₹47,000)",
    );
    expect(
      describeActivity(due, { kind: "client", businessName: "Deon Digital" })
        .text,
    ).toBe("Deon Digital asked for the Before launch payment (₹47,000)");
    const paid = ev({
      type: "payment.reported",
      actor: rahul,
      data: { title: "Before launch", amount: 4_700_000, currency: "INR" },
    });
    expect(
      describeActivity(paid, { kind: "member", userId: "u1" }),
    ).toMatchObject({
      text: "Rahul Mehta said the Before launch payment was made (₹47,000)",
      tone: "waiting",
    });
    expect(isClientVisible("payment.confirmed")).toBe(true);
  });

  it("reads correctly for 'You', a name and the business on 'not received'", () => {
    const e = ev({
      type: "payment.not_received",
      data: { title: "Advance", comment: "Check the UTR" },
    });
    expect(describeActivity(e, { kind: "member", userId: "u1" }).text).toBe(
      "You marked the Advance payment as not received yet",
    );
    expect(
      describeActivity(e, { kind: "client", businessName: "Asha Designs" })
        .text,
    ).toBe("Asha Designs marked the Advance payment as not received yet");
  });
});
