import type { Minor } from "@/shared/lib/money";
import type { ProjectStatement } from "../domain/snapshot";
import { Label } from "./invoice-parties";

/** On the final invoice: the whole project, so the client sees it adds up. */
export function InvoiceStatement({
  statement,
  money,
  invoiceTotal,
}: {
  statement: ProjectStatement;
  money: (amount: Minor) => string;
  /** This invoice's total, GST included. */
  invoiceTotal: Minor;
}) {
  const owed = statement.owedWithGst;
  return (
    <section className="mt-10 grid [break-inside:avoid] gap-3">
      <Label>Project statement (before GST)</Label>
      <dl className="grid gap-1.5 text-[0.9rem] tabular-nums">
        <Line label="Agreed scope">{money(statement.originalScope)}</Line>
        {statement.changes.map((c) => (
          <Line key={c.label} label={c.label}>
            {money(c.amount)}
          </Line>
        ))}
        <Line label="Project total" strong>
          {money(statement.projectTotal)}
        </Line>
        <Line label="Paid before this invoice">
          − {money(statement.receivedBefore)}
        </Line>
        {statement.awaitingBefore > 0 && (
          <Line label="Asked for earlier, not paid yet">
            − {money(statement.awaitingBefore)}
          </Line>
        )}
        <Line label="This invoice">− {money(statement.thisInvoice)}</Line>
        <Line label="Left after this" strong>
          {money(statement.balanceAfter)}
        </Line>
      </dl>
      {/* What's actually payable, GST included, kept apart from the
          before-GST lines above so each block adds up on its own. */}
      {owed !== undefined && (
        <>
          <Label>To pay now (with GST)</Label>
          <dl className="grid gap-1.5 text-[0.9rem] tabular-nums">
            {owed - invoiceTotal > 0 && (
              <Line label="Earlier invoices, not paid yet">
                {money((owed - invoiceTotal) as Minor)}
              </Line>
            )}
            <Line label="This invoice">{money(invoiceTotal)}</Line>
            <Line label="Total to pay" strong>
              {money(owed)}
            </Line>
          </dl>
        </>
      )}
    </section>
  );
}

function Line({
  label,
  strong,
  children,
}: {
  label: string;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        strong
          ? "flex justify-between gap-6 border-t pt-1.5 font-semibold"
          : "flex justify-between gap-6"
      }
    >
      <dt className={strong ? "" : "text-pretty text-[#3a3d44]"}>{label}</dt>
      <dd className="shrink-0">{children}</dd>
    </div>
  );
}
