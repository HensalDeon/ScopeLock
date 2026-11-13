import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import { recoveredCsv } from "./csv";
import {
  recoveredReport,
  reportYears,
  type ReportChange,
  type ReportProject,
} from "./recovered-report";

const ist = (s: string) => new Date(`${s}T12:00:00+05:30`);
const now = ist("2026-11-13");

const change = (
  id: string,
  over: Partial<ReportChange> = {},
): ReportChange => ({
  id,
  number: 1,
  label: "CR-001",
  title: "Blog + WhatsApp chat button",
  projectId: "p1",
  currency: "INR",
  total: minor(1_500_000),
  approvedAt: ist("2026-11-02"),
  ...over,
});

const projects = new Map<string, ReportProject>([
  [
    "p1",
    { name: "Website redesign", clientId: "c1", clientName: "Rahul Mehta" },
  ],
  ["p2", { name: "Menu app", clientId: "c2", clientName: "Priya Nair" }],
]);

const changes = [
  change("cr1"),
  change("cr2", {
    number: 2,
    label: "CR-002",
    total: minor(800_000),
    approvedAt: ist("2026-06-10"),
  }),
  change("cr3", {
    projectId: "p2",
    total: minor(2_000_000),
    approvedAt: ist("2026-11-05"),
  }),
  // Last financial year: not in 2026–27.
  change("cr0", { approvedAt: ist("2026-03-20") }),
  change("usd", {
    projectId: "p2",
    number: 2,
    label: "CR-002",
    currency: "USD",
    total: minor(50_000),
  }),
];

const report = recoveredReport({
  fy: 2026,
  changes,
  payments: [
    {
      changeId: "cr1",
      amount: minor(1_500_000),
      state: "received",
      invoice: "INV/26-27/004",
      receivedOn: "2026-11-10",
    },
    // Asked for on the final payment, not paid yet.
    {
      changeId: "cr3",
      amount: minor(500_000),
      state: "received",
      invoice: "INV/26-27/005",
      receivedOn: "2026-11-11",
    },
    {
      changeId: "cr3",
      amount: minor(1_000_000),
      state: "asked",
      invoice: "INV/26-27/006",
      receivedOn: null,
    },
    // Paid more than approved (a re-price): capped at the approved value.
    {
      changeId: "cr2",
      amount: minor(900_000),
      state: "received",
      invoice: "INV/26-27/002",
      receivedOn: "2026-08-20",
    },
  ],
  projects,
  now,
});

describe("recoveredReport", () => {
  it("keeps currencies apart, rupees first", () => {
    expect(report.currencies.map((c) => c.currency)).toEqual(["INR", "USD"]);
    const inr = report.currencies[0]!;
    expect(inr.count).toBe(3);
    expect(inr.approved).toBe(4_300_000);
    expect(inr.received).toBe(2_800_000);
    expect(inr.outstanding).toBe(1_500_000);
    // Of what's still to come: asked for vs not asked yet.
    expect(inr.asked).toBe(1_000_000);
    expect(inr.notAsked).toBe(500_000);
  });

  it("goes month by month, April to now", () => {
    const inr = report.currencies[0]!;
    expect(inr.months.map((m) => m.key)).toEqual([
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
    ]);
    const nov = inr.months.at(-1)!;
    expect(nov).toMatchObject({
      count: 2,
      approved: 3_500_000,
      received: 2_000_000,
    });
    expect(inr.months[2]).toMatchObject({ count: 1, approved: 800_000 });
    expect(inr.months[0]).toMatchObject({ count: 0, approved: 0 });
  });

  it("goes client by client, whoever still owes most first", () => {
    const inr = report.currencies[0]!;
    expect(inr.clients).toEqual([
      {
        clientId: "c2",
        name: "Priya Nair",
        count: 1,
        approved: 2_000_000,
        received: 500_000,
        asked: 1_000_000,
        notAsked: 500_000,
        outstanding: 1_500_000,
      },
      {
        clientId: "c1",
        name: "Rahul Mehta",
        count: 2,
        approved: 2_300_000,
        received: 2_300_000,
        asked: 0,
        notAsked: 0,
        outstanding: 0,
      },
    ]);
  });

  it("offers this year and every year with an approval", () => {
    expect(reportYears(changes, now)).toEqual([2026, 2025]);
    expect(reportYears([], now)).toEqual([2026]);
  });
});

describe("recoveredCsv", () => {
  it("one row per change request, plain amounts, oldest first", () => {
    const lines = recoveredCsv(report.rows).trim().split("\r\n");
    expect(lines[0]).toBe(
      "Approved on,Change request,Title,Project,Client,Currency,Amount before GST,Received,Last received on,Asked for (not paid yet),Not asked for yet,Invoices",
    );
    expect(lines[1]).toBe(
      "2026-06-10,CR-002,Blog + WhatsApp chat button,Website redesign,Rahul Mehta,INR,8000.00,8000.00,2026-08-20,0.00,0.00,INV/26-27/002",
    );
    expect(lines).toHaveLength(5);
  });

  it("quotes commas and stops a title from becoming a formula", () => {
    const [row] = recoveredReport({
      fy: 2026,
      changes: [change("x", { title: '=HYPERLINK("evil"), "SEO"' })],
      payments: [],
      projects,
      now,
    }).rows;
    const line = recoveredCsv([row!]).split("\r\n")[1];
    expect(line).toContain(`"'=HYPERLINK(""evil""), ""SEO"""`);
  });
});
