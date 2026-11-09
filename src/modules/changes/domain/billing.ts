import { allocate, minor, sum, type Minor } from "@/shared/lib/money";
import {
  changeLabel,
  type BillingOption,
  type ChangeBilling,
  type ChangeRequest,
  type ChangeStatus,
  type Placement,
} from "./change-request";

/** Billing: where a change request's money lands in the payment schedule. */

export type MilestoneRef = {
  id: string;
  name: string;
  baseAmount: Minor;
  order: number;
};

/**
 * Where a change's total goes. `paidMilestoneIds` are payments already
 * received (Phase 5); a change is never added to those. With nothing left
 * to add to, it becomes a payment of its own, due now.
 */
export function placeChange(
  total: Minor,
  billing: ChangeBilling,
  milestones: readonly MilestoneRef[],
  paidMilestoneIds: readonly string[] = [],
): Placement[] {
  const remaining = [...milestones]
    .sort((a, b) => a.order - b.order)
    .filter((m) => !paidMilestoneIds.includes(m.id));
  const dueNow: Placement[] = [{ milestoneId: null, amount: total }];
  const first = remaining[0];
  const last = remaining.at(-1);
  if (billing.option === "pay_now" || !first || !last) return dueNow;

  switch (billing.option) {
    case "final":
      return [{ milestoneId: last.id, amount: total }];
    case "next_milestone":
      return [{ milestoneId: first.id, amount: total }];
    case "milestone": {
      const target = remaining.find((m) => m.id === billing.milestoneId);
      return target ? [{ milestoneId: target.id, amount: total }] : dueNow;
    }
    case "split": {
      // In proportion to the payments themselves (30/30/40 stays 30/30/40).
      const parts = allocate(
        total,
        remaining.map((m) => m.baseAmount),
      );
      return remaining.map((m, i) => ({
        milestoneId: m.id,
        amount: parts[i] ?? minor(0),
      }));
    }
  }
}

/** Plain words for the client and the freelancer. */
export function billingSummary(
  billing: ChangeBilling,
  milestones: readonly MilestoneRef[],
): string {
  const sorted = [...milestones].sort((a, b) => a.order - b.order);
  const name = (m: MilestoneRef | undefined) =>
    m ? `the “${m.name}” payment` : "a separate payment, due now";
  switch (billing.option) {
    case "pay_now":
      return "Paid as a separate payment, due once approved.";
    case "final":
      return `Added to ${name(sorted.at(-1))}.`;
    case "next_milestone":
      return `Added to the next payment due.`;
    case "milestone":
      return `Added to ${name(sorted.find((m) => m.id === billing.milestoneId))}.`;
    case "split":
      return sorted.length > 1
        ? `Split across the remaining payments, in the same proportions.`
        : `Added to ${name(sorted[0])}.`;
  }
}

export type ScheduleRow = MilestoneRef & {
  additions: { label: string; amount: Minor }[];
  total: Minor;
};

/**
 * The payment schedule with approved changes added in. Changes that are
 * paid separately come back in `dueNow`.
 */
export function scheduleWithChanges(
  milestones: readonly MilestoneRef[],
  approved: readonly Pick<ChangeRequest, "number" | "total" | "billing">[],
  paidMilestoneIds: readonly string[] = [],
): { rows: ScheduleRow[]; dueNow: { label: string; amount: Minor }[] } {
  const rows: ScheduleRow[] = [...milestones]
    .sort((a, b) => a.order - b.order)
    .map((m) => ({ ...m, additions: [], total: m.baseAmount }));
  const dueNow: { label: string; amount: Minor }[] = [];
  for (const change of [...approved].sort((a, b) => a.number - b.number)) {
    const label = changeLabel(change.number);
    for (const part of placeChange(
      change.total,
      change.billing,
      milestones,
      paidMilestoneIds,
    )) {
      const row = rows.find((r) => r.id === part.milestoneId);
      if (row) {
        row.additions.push({ label, amount: part.amount });
        row.total = sum([row.total, part.amount]);
      } else {
        dueNow.push({ label, amount: part.amount });
      }
    }
  }
  return { rows, dueNow };
}

/** For the project's denormalised totals. */
export function changeTotals(
  changes: readonly Pick<ChangeRequest, "status" | "total">[],
): { approved: Minor; pending: Minor } {
  return {
    approved: sum(
      changes.filter((c) => c.status === "approved").map((c) => c.total),
    ),
    pending: sum(
      changes.filter((c) => c.status === "sent").map((c) => c.total),
    ),
  };
}

/** The schedule additions as the project's payment table takes them. */
export function scheduleAdditions(
  milestones: readonly MilestoneRef[],
  changes: readonly Pick<
    ChangeRequest,
    "number" | "total" | "billing" | "status"
  >[],
): {
  byMilestone: Record<string, { label: string; amount: Minor }[]>;
  dueNow: { label: string; amount: Minor }[];
} {
  const { rows, dueNow } = scheduleWithChanges(
    milestones,
    changes.filter((c) => c.status === "approved"),
  );
  return {
    byMilestone: Object.fromEntries(rows.map((r) => [r.id, r.additions])),
    dueNow,
  };
}

/** Counts and sums for the scope table's footer. */
export function changeSummary(
  changes: readonly Pick<ChangeRequest, "status" | "total">[],
): {
  approved: { count: number; total: Minor };
  pending: { count: number; total: Minor };
} {
  const of = (status: ChangeStatus) => {
    const list = changes.filter((c) => c.status === status);
    return { count: list.length, total: sum(list.map((c) => c.total)) };
  };
  return { approved: of("approved"), pending: of("sent") };
}

/**
 * The "when it's paid" choices for a project. With a single payment
 * (upfront billing) only "separate payment" and "add to it" make sense.
 */
export function billingChoices(
  milestones: readonly { name: string }[],
): { value: BillingOption; label: string; detail: string }[] {
  const separate = {
    value: "pay_now" as const,
    label: "Ask for it as a separate payment",
    detail: "Due once your client approves it.",
  };
  if (milestones.length <= 1) {
    return [
      separate,
      {
        value: "final",
        label: "Add it to the full payment",
        detail: "Only if the full payment hasn't been paid yet.",
      },
    ];
  }
  const last = milestones.at(-1);
  return [
    {
      value: "final",
      label: "Add to the final payment",
      detail: last ? `Goes on “${last.name}”.` : "",
    },
    {
      value: "next_milestone",
      label: "Add to the next payment due",
      detail: "The next payment that hasn't been paid.",
    },
    {
      value: "split",
      label: "Split across the remaining payments",
      detail: "In the same proportions as the payment schedule.",
    },
    {
      value: "milestone",
      label: "Add to a specific payment",
      detail: "Choose which one below.",
    },
    separate,
  ];
}

/**
 * An approved change's placement: the one fixed at approval, or (for older
 * changes) worked out now with no payments requested yet.
 */
export function placementOf(
  change: Pick<ChangeRequest, "placement" | "total" | "billing">,
  milestones: readonly MilestoneRef[],
): Placement[] {
  return (
    change.placement ?? placeChange(change.total, change.billing, milestones)
  );
}

/** What the "When it's paid" choices need to show real amounts. */
export type BillingContext = {
  milestones: MilestoneRef[];
  /** Each payment as it stands now (base + approved changes), before GST. */
  current: Record<string, Minor>;
  /** Payments already asked for or received: nothing more is added to them. */
  closed: Record<string, "asked" | "received">;
};

/**
 * The schedule as it stands, from the project's payments and approved
 * changes. `payments` are the requests made so far (key = milestone id).
 */
export function billingContext(
  milestones: readonly MilestoneRef[],
  changes: readonly Pick<
    ChangeRequest,
    "number" | "total" | "billing" | "status" | "placement"
  >[],
  payments: readonly { key: string; status: string }[],
): BillingContext {
  const closed: BillingContext["closed"] = {};
  for (const p of payments) {
    if (p.status === "confirmed") closed[p.key] = "received";
    else if (p.status === "due" || p.status === "client_reported")
      closed[p.key] = "asked";
  }
  const current: Record<string, Minor> = Object.fromEntries(
    milestones.map((m) => [m.id, m.baseAmount]),
  );
  for (const change of changes.filter((c) => c.status === "approved")) {
    for (const part of placementOf(change, milestones)) {
      if (part.milestoneId && part.milestoneId in current)
        current[part.milestoneId] = sum([
          current[part.milestoneId] ?? minor(0),
          part.amount,
        ]);
    }
  }
  return { milestones: [...milestones], current, closed };
}

/**
 * One choice in words with this change's amount, using the same rule as
 * approval (placeChange): "Goes on “Advance”: ₹9,600 becomes ₹21,600."
 * Null when there's no amount yet (the generic wording shows instead).
 */
export function billingPreview(
  total: Minor,
  billing: ChangeBilling,
  ctx: BillingContext,
  money: (amount: Minor) => string,
): string | null {
  if (total <= 0) return null;
  if (billing.option === "milestone" && !billing.milestoneId) return null;
  const parts = placeChange(
    total,
    billing,
    ctx.milestones,
    Object.keys(ctx.closed),
  );
  const name = (id: string) =>
    ctx.milestones.find((m) => m.id === id)?.name ?? "";
  const [only] = parts;
  if (parts.length === 1 && only) {
    if (only.milestoneId === null)
      return billing.option === "pay_now"
        ? `${money(total)}, due once your client approves it.`
        : `Every payment here has been asked for, so it becomes a separate payment of ${money(total)}.`;
    const now = ctx.current[only.milestoneId] ?? minor(0);
    return `Goes on “${name(only.milestoneId)}”: ${money(now)} becomes ${money(sum([now, only.amount]))}.`;
  }
  return parts
    .map(
      (p) =>
        `“${p.milestoneId ? name(p.milestoneId) : "Separate"}” +${money(p.amount)}`,
    )
    .join(" · ");
}
