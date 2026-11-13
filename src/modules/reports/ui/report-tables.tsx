import type { Route } from "next";
import Link from "next/link";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, type Minor } from "@/shared/lib/money";
import type { Page } from "@/shared/lib/pagination";
import { cn } from "@/shared/lib/utils";
import { Pagination } from "@/shared/ui/pagination";
import { owedText } from "./owed";
import type {
  ClientLine,
  MonthLine,
  ReportTotals,
} from "../domain/recovered-report";

const HEAD =
  "px-4 py-2.5 text-left font-mono text-[11px] font-normal tracking-[0.12em] text-muted-foreground uppercase first:pl-5 last:pr-5";
const CELL = "px-4 py-3 align-top first:pl-5 last:pr-5";
const NUM = "text-right tabular-nums";
/** Shown from sm up; on phones the row's second line carries it. */
const WIDE = "max-sm:hidden";
const SUB =
  "mt-0.5 block text-[13px] font-normal text-muted-foreground tabular-nums";

const changes = (n: number) => `${n} change${n === 1 ? "" : "s"}`;

/** An amount, or a muted dash for none (read out as "none"). */
function Money({
  amount,
  currency,
}: {
  amount: Minor;
  currency: CurrencyCode;
}) {
  if (amount === 0)
    return (
      <span className="text-muted-foreground">
        <span aria-hidden>–</span>
        <span className="sr-only">none</span>
      </span>
    );
  return <>{formatMoney(amount, currency)}</>;
}

/** Client by client, most approved first: who still owes what. */
export function ClientTable({
  id,
  page,
  totals,
  currency,
  totalLabel,
  href,
  rowHref,
}: {
  id: string;
  page: Page<ClientLine>;
  totals: ReportTotals;
  currency: CurrencyCode;
  totalLabel: string;
  href: (page: number) => Route;
  /** A client's row: their change requests not received yet. */
  rowHref: (clientId: string) => Route;
}) {
  const owed = (line: ReportTotals) => owedText(line, currency);
  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-xl border bg-background">
        <table aria-labelledby={id} className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th scope="col" className={cn(HEAD, "sm:w-[40%]")}>
                Client
              </th>
              <th scope="col" className={cn(HEAD, NUM)}>
                Approved
              </th>
              <th scope="col" className={cn(HEAD, NUM, WIDE)}>
                Received
              </th>
              <th scope="col" className={cn(HEAD, NUM, WIDE)}>
                Still to receive
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {page.items.map((c) => (
              // The whole row opens what this client still owes (a 44px+
              // target on phones).
              <tr
                key={c.clientId ?? c.name}
                className={cn(c.clientId && "group relative hover:bg-muted/40")}
              >
                <th scope="row" className={cn(CELL, "text-left font-normal")}>
                  {c.clientId ? (
                    <Link
                      href={rowHref(c.clientId)}
                      className="font-medium underline-offset-4 group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring/60 focus-visible:after:ring-inset"
                    >
                      {c.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{c.name}</span>
                  )}
                  <span className={SUB}>
                    {changes(c.count)} · {owed(c)}
                  </span>
                </th>
                <td className={cn(CELL, NUM)}>
                  <Money amount={c.approved} currency={currency} />
                </td>
                <td className={cn(CELL, NUM, WIDE)}>
                  <Money amount={c.received} currency={currency} />
                </td>
                <td
                  className={cn(
                    CELL,
                    NUM,
                    WIDE,
                    c.outstanding > 0 && "font-medium",
                  )}
                >
                  <Money amount={c.outstanding} currency={currency} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-canvas font-medium">
            <tr>
              <th scope="row" className={cn(CELL, "text-left")}>
                {totalLabel}
                <span className={cn(SUB, "sm:hidden")}>
                  {changes(totals.count)} · {owed(totals)}
                </span>
              </th>
              <td className={cn(CELL, NUM)}>
                <Money amount={totals.approved} currency={currency} />
              </td>
              <td className={cn(CELL, NUM, WIDE)}>
                <Money amount={totals.received} currency={currency} />
              </td>
              <td className={cn(CELL, NUM, WIDE)}>
                <Money amount={totals.outstanding} currency={currency} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <Pagination page={page} noun="clients" href={href} />
    </div>
  );
}

/** Month by month, April first, by the month the client approved. */
export function MonthTable({
  id,
  months,
  totals,
  currency,
  totalLabel,
}: {
  id: string;
  months: MonthLine[];
  totals: ReportTotals;
  currency: CurrencyCode;
  totalLabel: string;
}) {
  const sub = (line: ReportTotals) =>
    `${changes(line.count)} · ${
      line.received === 0
        ? "none received yet"
        : `${formatMoney(line.received, currency)} of it received`
    }`;
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <table aria-labelledby={id} className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th scope="col" className={cn(HEAD, "sm:w-[40%]")}>
              Month
            </th>
            <th scope="col" className={cn(HEAD, NUM, WIDE)}>
              Changes
            </th>
            <th scope="col" className={cn(HEAD, NUM)}>
              Approved
            </th>
            <th scope="col" className={cn(HEAD, NUM, WIDE)}>
              Of that, received
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {months.map((m) => (
            <tr key={m.key}>
              <th scope="row" className={cn(CELL, "text-left font-normal")}>
                <span
                  className={cn(
                    "tabular-nums",
                    m.count === 0 && "text-muted-foreground",
                  )}
                >
                  {m.label}
                </span>
                {m.count > 0 && (
                  <span className={cn(SUB, "sm:hidden")}>{sub(m)}</span>
                )}
              </th>
              <td className={cn(CELL, NUM, WIDE)}>
                {m.count === 0 ? (
                  <Money amount={0 as Minor} currency={currency} />
                ) : (
                  m.count
                )}
              </td>
              <td className={cn(CELL, NUM)}>
                <Money amount={m.approved} currency={currency} />
              </td>
              <td className={cn(CELL, NUM, WIDE)}>
                <Money amount={m.received} currency={currency} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t bg-canvas font-medium">
          <tr>
            <th scope="row" className={cn(CELL, "text-left")}>
              {totalLabel}
              <span className={cn(SUB, "sm:hidden")}>{sub(totals)}</span>
            </th>
            <td className={cn(CELL, NUM, WIDE)}>{totals.count}</td>
            <td className={cn(CELL, NUM)}>
              <Money amount={totals.approved} currency={currency} />
            </td>
            <td className={cn(CELL, NUM, WIDE)}>
              <Money amount={totals.received} currency={currency} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
