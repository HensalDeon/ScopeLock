import type { ScheduleTotals } from "@/modules/payments";
import { minor, sum, type Minor } from "@/shared/lib/money";
import { Row } from "./portal-rows";

/**
 * The client's project total: the approved price and changes, then the GST
 * their invoices add (when there is any), and what they've paid so far.
 */
export function PortalTotals({
  proposalTotal,
  approvedChanges,
  payments,
  money,
}: {
  proposalTotal: Minor;
  approvedChanges: Minor;
  /** Null until the proposal is approved. */
  payments: ScheduleTotals | null;
  money: (amount: number) => string;
}) {
  const total = sum([proposalTotal, approvedChanges]);
  const gst = payments?.gst ?? null;
  const paid = gst ? gst.received : (payments?.received ?? minor(0));
  const due = gst ? gst.due : (payments?.due ?? minor(0));
  return (
    <section aria-labelledby="totals-heading" className="grid gap-2">
      <h2 id="totals-heading" className="text-base font-semibold">
        Project total
      </h2>
      <dl className="grid gap-1.5 text-sm">
        <Row label="Approved proposal">{money(proposalTotal)}</Row>
        {approvedChanges > 0 && (
          <Row label="Approved changes">{money(approvedChanges)}</Row>
        )}
        {gst ? (
          <>
            <Row label="Total before GST">{money(total)}</Row>
            <Row label="GST on invoices">{money(gst.tax)}</Row>
            <Row label="Total with GST" strong>
              {money(sum([total, gst.tax]))}
            </Row>
          </>
        ) : (
          <Row label="Project total" strong>
            {money(total)}
          </Row>
        )}
        {paid > 0 && <Row label="Received">{money(paid)}</Row>}
        {due > 0 && (
          <Row label="Due now" tone="waiting">
            {money(due)}
          </Row>
        )}
      </dl>
    </section>
  );
}
