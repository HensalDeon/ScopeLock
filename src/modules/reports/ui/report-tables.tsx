import type { Route } from "next";
import Link from "next/link";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, type Minor } from "@/shared/lib/money";
import type { Page } from "@/shared/lib/pagination";
import { cn } from "@/shared/lib/utils";
import { Pagination } from "@/shared/ui/pagination";
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

/** Client by client, whoever still owes most first. */
export function ClientTable({
  id,
  page,
  totals,
  currency,
  totalLabel,
  href,
  rowHref,
  selected,
  unpaidCount,
}: {
  id: string;
  page: Page<ClientLine>;
  totals: ReportTotals;
  currency: CurrencyCode;
  totalLabel: string;
  href: (page: number) => Route;
  /** A client's row: their change requests not received yet. */
  rowHref: (clientId: string) => Route;
  /** The client "Not received yet" is narrowed to. */
  selected: string | null;
  /** Change requests not received yet, per client. */
  unpaidCount: ReadonlyMap<string, number>;
}) {
  const money = (n: Minor) => formatMoney(n, currency);
  const asked = (line: ReportTotals) =>
    line.asked > 0 ? `${money(line.asked)} asked for` : null;
  // Phones show one figure (still to receive); the rest goes under the name.
  const phoneLine = (line: ReportTotals) =>
    [`${money(line.approved)} approved`, asked(line)]
      .filter(Boolean)
      .join(", ");
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
                Still to receive
              </th>
              <th scope="col" className={cn(HEAD, NUM, WIDE)}>
                Received
              </th>
              <th scope="col" className={cn(HEAD, NUM, WIDE)}>
                Approved
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {page.items.map((c) => {
              const unpaid = c.clientId
                ? (unpaidCount.get(c.clientId) ?? 0)
                : 0;
              const linked = c.clientId !== null && unpaid > 0;
              const isSelected = c.clientId !== null && c.clientId === selected;
              return (
                // A row with something owed narrows "Not received yet" to
                // that client (the whole row: a 44px+ target on phones).
                <tr
                  key={c.clientId ?? c.name}
                  aria-current={isSelected ? "true" : undefined}
                  className={cn(
                    linked && "group relative hover:bg-muted/40",
                    isSelected && "bg-muted/60",
                  )}
                >
                  <th scope="row" className={cn(CELL, "text-left font-normal")}>
                    {linked && c.clientId ? (
                      <Link
                        href={rowHref(c.clientId)}
                        aria-label={`${c.name}: show ${unpaid} change request${unpaid === 1 ? "" : "s"} not received yet`}
                        className="font-medium underline decoration-foreground/25 underline-offset-4 group-hover:decoration-foreground after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring/60 focus-visible:after:ring-inset"
                      >
                        {c.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{c.name}</span>
                    )}
                    <span className={SUB}>
                      {changes(c.count)}
                      <span className="sm:hidden"> · {phoneLine(c)}</span>
                    </span>
                  </th>
                  <td className={cn(CELL, NUM)}>
                    <span className={cn(c.outstanding > 0 && "font-medium")}>
                      <Money amount={c.outstanding} currency={currency} />
                    </span>
                    {asked(c) && (
                      <span className={cn(SUB, WIDE, "text-warning-ink")}>
                        {asked(c)}
                      </span>
                    )}
                  </td>
                  <td className={cn(CELL, NUM, WIDE)}>
                    <Money amount={c.received} currency={currency} />
                  </td>
                  <td className={cn(CELL, NUM, WIDE)}>
                    <Money amount={c.approved} currency={currency} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t bg-canvas font-medium">
            <tr>
              <th scope="row" className={cn(CELL, "text-left")}>
                {totalLabel}
                <span className={cn(SUB, "sm:hidden")}>
                  {changes(totals.count)} · {phoneLine(totals)}
                </span>
              </th>
              <td className={cn(CELL, NUM)}>
                <Money amount={totals.outstanding} currency={currency} />
              </td>
              <td className={cn(CELL, NUM, WIDE)}>
                <Money amount={totals.received} currency={currency} />
              </td>
              <td className={cn(CELL, NUM, WIDE)}>
                <Money amount={totals.approved} currency={currency} />
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
