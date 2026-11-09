import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import { buildStatement, type StatementInput } from "./statement";

const at = new Date("2026-11-09T10:46:00Z");
const input: StatementInput = {
  business: { name: "Asha Designs", email: null, phone: null },
  client: { name: "Rahul Mehta", company: null },
  projectTitle: "Website redesign",
  reference: "P-007",
  currency: "INR",
  agreed: { total: minor(8_000_000), approvedBy: { name: "Rahul Mehta", at } },
  changes: [
    {
      label: "CR-001",
      title: "Blog",
      total: minor(1_500_000),
      status: "approved",
      decision: { decision: "approved", name: "Rahul Mehta", at },
    },
    {
      label: "CR-002",
      title: "Gallery",
      total: minor(600_000),
      status: "rejected",
      decision: { decision: "rejected", name: "Rahul Mehta", at },
    },
    {
      label: "CR-003",
      title: "Draft idea",
      total: minor(100_000),
      status: "draft",
      decision: null,
    },
  ],
  payments: [
    {
      label: "Advance",
      total: minor(2_400_000),
      tax: minor(432_000),
      payable: minor(2_832_000),
      state: "received",
      invoiceNumber: "AD/26-27/007",
      requestedAt: at,
      receivedOn: "2026-11-09",
    },
    {
      label: "Design approved",
      total: minor(2_400_000),
      tax: minor(432_000),
      payable: minor(2_832_000),
      state: "due",
      invoiceNumber: "AD/26-27/009",
      requestedAt: at,
      receivedOn: null,
    },
    {
      label: "Before launch",
      total: minor(4_700_000),
      tax: minor(846_000),
      payable: minor(5_546_000),
      state: "upcoming",
      invoiceNumber: null,
      requestedAt: null,
      receivedOn: null,
    },
  ],
  asOf: at,
};

describe("buildStatement", () => {
  const s = buildStatement(input);
  it("lists what the client saw, with what happened", () => {
    expect(s.changeRows.map((r) => [r.label, r.status, r.counts])).toEqual([
      ["CR-001", "Approved by Rahul Mehta on 9 Nov 2026", true],
      ["CR-002", "Declined by Rahul Mehta on 9 Nov 2026", false],
    ]);
    expect(s.paymentRows.map((r) => r.status)).toEqual([
      "Received on 9 Nov 2026",
      "Asked for on 9 Nov 2026",
      "Not asked for yet",
    ]);
  });
  it("adds up: scope + approved changes, then GST, received, due, to ask", () => {
    expect(s.totals).toMatchObject({
      projectTotal: 9_500_000,
      tax: 1_710_000,
      withGst: 11_210_000,
      received: 2_832_000,
      due: 2_832_000,
      toAsk: 5_546_000,
    });
  });
});
