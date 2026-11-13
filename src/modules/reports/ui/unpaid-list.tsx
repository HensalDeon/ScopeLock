import type { Route } from "next";
import Link from "next/link";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatDate } from "@/shared/lib/dates";
import { formatMoney } from "@/shared/lib/money";
import type { Page } from "@/shared/lib/pagination";
import { cn } from "@/shared/lib/utils";
import { Pagination } from "@/shared/ui/pagination";
import { TOUCH_LINK } from "@/shared/ui/touch";
import type { ReportRow } from "../domain/recovered-report";

/**
 * "Not received yet": each approved change request with money still to
 * come, oldest first, saying whether it has been asked for. Each opens its
 * change request, where its payment is asked for or confirmed.
 */
export function UnpaidList({
  id,
  page,
  currency,
  client,
  allHref,
  href,
}: {
  id: string;
  page: Page<ReportRow>;
  currency: CurrencyCode;
  /** Narrowed to one client: their name. */
  client: string | null;
  /** The list for every client. */
  allHref: Route;
  href: (page: number) => Route;
}) {
  const money = (n: ReportRow["amount"]) => formatMoney(n, currency);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id={id} className="scroll-mt-20 text-[15px] font-semibold">
          {client ? `Not received yet from ${client}` : "Not received yet"}
        </h3>
        {client && (
          <Link
            href={allHref}
            className={cn(
              "text-sm font-medium underline underline-offset-4",
              TOUCH_LINK,
            )}
          >
            Show every client
          </Link>
        )}
      </div>
      {page.total === 0 ? (
        <p className="text-sm text-muted-foreground">
          {client
            ? `Everything ${client} approved this year has been paid.`
            : "Every change request approved this year has been paid."}
        </p>
      ) : (
        <ul
          aria-labelledby={id}
          className="divide-y rounded-xl border bg-background"
        >
          {page.items.map((r) => (
            <li
              key={r.changeId}
              className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 px-5 py-3 text-sm hover:bg-muted/40"
            >
              <div className="grid min-w-0 gap-0.5">
                <Link
                  href={`/projects/${r.projectId}/changes/${r.number}` as Route}
                  className="font-medium underline-offset-4 group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring/60 focus-visible:after:ring-inset"
                >
                  <span className="font-mono text-[13px] tabular-nums">
                    {r.label}
                  </span>{" "}
                  {r.title}
                </Link>
                <p className="text-[13px] text-pretty text-muted-foreground tabular-nums">
                  {r.projectName}
                  {client ? "" : ` · ${r.clientName}`} · approved{" "}
                  {formatDate(r.approvedAt)}
                </p>
                <Status row={r} money={money} className="sm:hidden" />
              </div>
              <div className="grid justify-items-end gap-0.5 text-right tabular-nums">
                <span className="font-medium">{money(r.outstanding)}</span>
                <Status row={r} money={money} className="max-sm:hidden" />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} noun="change requests" href={href} />
    </div>
  );
}

/** Asked for (a payment request is out) or not asked for yet. */
function Status({
  row: r,
  money,
  className,
}: {
  row: ReportRow;
  money: (n: ReportRow["amount"]) => string;
  className?: string;
}) {
  return (
    <span className={cn("text-[13px] tabular-nums", className)}>
      {r.asked > 0 && r.notAsked > 0 ? (
        <>
          <span className="text-warning-ink">{money(r.asked)} asked for</span>
          <span className="text-muted-foreground">
            {" "}
            · {money(r.notAsked)} not yet
          </span>
        </>
      ) : r.asked > 0 ? (
        <span className="text-warning-ink">Asked for</span>
      ) : (
        <span className="text-muted-foreground">Not asked for yet</span>
      )}
    </span>
  );
}
