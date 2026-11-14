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
import { AskBadges } from "./ask-badges";

/**
 * "Not received yet": each approved change request with money still to
 * come, oldest first, with whether (and when) it was asked for. Each opens
 * its change request, where its payment is asked for or confirmed.
 */
export function UnpaidList({
  id,
  page,
  currency,
  client,
  empty,
  allHref,
  href,
  now,
}: {
  id: string;
  page: Page<ReportRow>;
  currency: CurrencyCode;
  /** Narrowed to one client: their name. */
  client: string | null;
  /** What to say when nothing is owed ("…in FY 2025–26"). */
  empty: string;
  /** The list for every client. */
  allHref: Route;
  href: (page: number) => Route;
  now: Date;
}) {
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
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul
          aria-labelledby={id}
          className="divide-y rounded-xl border bg-background"
        >
          {page.items.map((r) => (
            <li
              key={r.changeId}
              className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 px-5 py-3 text-sm hover:bg-muted/40"
            >
              <div className="grid min-w-0 gap-0.5">
                <Link
                  href={`/projects/${r.projectId}/changes/${r.number}` as Route}
                  className="font-medium underline decoration-foreground/25 underline-offset-4 group-hover:decoration-foreground after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring/60 focus-visible:after:ring-inset"
                >
                  <span className="font-mono text-[13px] tabular-nums">
                    {r.label}
                  </span>{" "}
                  {r.title}
                </Link>
                <p className="text-[13px] text-pretty text-muted-foreground tabular-nums">
                  {r.projectName}
                  {client ? "" : ` · ${r.clientName}`} · approved{" "}
                  {formatDate(r.approvedAt, { now })}
                </p>
              </div>
              <span className="text-right font-medium tabular-nums">
                {formatMoney(r.outstanding, currency)}
              </span>
              <AskBadges
                asked={r.asked}
                notAsked={r.notAsked}
                askedAt={r.askedAt}
                currency={currency}
                now={now}
                className="col-span-2"
              />
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} noun="change requests" href={href} />
    </div>
  );
}
