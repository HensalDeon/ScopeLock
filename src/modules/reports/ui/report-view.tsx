import { Download } from "lucide-react";
import Link from "next/link";
import { currencyLabel } from "@/shared/lib/currency";
import { formatDate } from "@/shared/lib/dates";
import { formatMoney } from "@/shared/lib/money";
import { clampPage, PAGE_SIZE, toPage } from "@/shared/lib/pagination";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/list-states";
import { PageHeader } from "@/shared/ui/page";
import { TOUCH_LINK } from "@/shared/ui/touch";
import { financialYearLabel } from "../domain/financial-year";
import type {
  CurrencyReport,
  RecoveredReport,
} from "../domain/recovered-report";
import { reportHref } from "./report-href";
import { ClientTable, MonthTable } from "./report-tables";
import { UnpaidList } from "./unpaid-list";

const LABEL =
  "font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase";
const changes = (n: number) => `${n} change request${n === 1 ? "" : "s"}`;

function pageOf<T>(items: readonly T[], requested: number) {
  const page = clampPage(requested, items.length);
  return toPage(
    items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    items.length,
    page,
  );
}

type Query = {
  page: number;
  upage: number;
  client: string | null;
};

/**
 * Revenue recovered for one financial year (Agency): the year's figures,
 * who still owes what (and which change requests), and month by month,
 * per currency, with the CSV.
 */
export function RecoveredReportView({
  report,
  years,
  query,
  previous,
  current,
  asOf,
}: {
  report: RecoveredReport;
  years: number[];
  query: Query;
  /** The year before, when it has approvals (offered while this one is empty). */
  previous: { fy: number; count: number } | null;
  /** This is the year in progress: its figures are "so far". */
  current: boolean;
  asOf: Date;
}) {
  const year = `FY ${financialYearLabel(report.fy)}`;
  return (
    <>
      <PageHeader
        title="Revenue recovered"
        description="Change requests your clients approved, before GST, and how much of that has been received. Approval isn't payment, so both are shown."
        actions={
          report.rows.length > 0 && (
            <Button asChild variant="outline">
              <a href={`/reports/export?year=${report.fy}`} download>
                <Download aria-hidden />
                Download {year} CSV
              </a>
            </Button>
          )
        }
      />
      {years.length > 1 && (
        <nav
          aria-label="Financial year"
          className="mb-6 flex flex-wrap gap-x-5 gap-y-1 border-b text-sm"
        >
          {years.map((fy) => (
            <Link
              key={fy}
              href={reportHref({ fy })}
              aria-current={fy === report.fy ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 py-2 tabular-nums",
                TOUCH_LINK,
                fy === report.fy
                  ? "border-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              FY {financialYearLabel(fy)}
            </Link>
          ))}
        </nav>
      )}
      {report.currencies.length === 0 ? (
        <EmptyState
          title={`No change requests approved in ${year} yet`}
          action={
            previous ? (
              <Button asChild variant="outline">
                <Link href={reportHref({ fy: previous.fy })}>
                  See FY {financialYearLabel(previous.fy)} (
                  {changes(previous.count)})
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/projects">Open projects</Link>
              </Button>
            )
          }
        >
          When a client approves a change request, its price shows here by
          client and by month, with how much of it has been received. Start one
          from a project&apos;s page with &ldquo;New change request&rdquo;.
        </EmptyState>
      ) : (
        <div className="grid max-w-5xl gap-12">
          {current && (
            <p className="-mb-8 text-sm text-muted-foreground">
              {year} so far, as of {formatDate(asOf, { now: asOf })}.
            </p>
          )}
          {report.currencies.map((c) => (
            <CurrencySection
              key={c.currency}
              report={c}
              rows={report.rows}
              year={year}
              fy={report.fy}
              query={query}
              titled={report.currencies.length > 1}
            />
          ))}
        </div>
      )}
    </>
  );
}

function CurrencySection({
  report,
  rows,
  year,
  fy,
  query,
  titled,
}: {
  report: CurrencyReport;
  rows: RecoveredReport["rows"];
  year: string;
  fy: number;
  query: Query;
  /** More than one currency: name each. */
  titled: boolean;
}) {
  const money = (n: Parameters<typeof formatMoney>[0]) =>
    formatMoney(n, report.currency);
  const id = `recovered-${report.currency}`;
  const total = `Total, ${year}`;
  const client = query.client
    ? (report.clients.find((c) => c.clientId === query.client) ?? null)
    : null;
  const unpaid = rows.filter(
    (r) =>
      r.currency === report.currency &&
      r.outstanding > 0 &&
      (!client || r.clientId === client.clientId),
  );
  // Emerald marks money recovered and received (DESIGN.md, Settled Green).
  const figures = [
    {
      label: `Approved in ${year}`,
      value: money(report.approved),
      note: changes(report.count),
      settled: report.approved > 0,
    },
    {
      label: "Received so far",
      value: money(report.received),
      note:
        report.received === report.approved
          ? "All of it"
          : `Of ${money(report.approved)} approved`,
      settled: report.received > 0,
    },
    {
      label: "Still to receive",
      value: money(report.outstanding),
      note:
        report.outstanding === 0
          ? "Nothing left"
          : `${money(report.asked)} asked for, ${money(report.notAsked)} not yet`,
      settled: false,
    },
  ];
  return (
    <section aria-labelledby={id} className="grid gap-8">
      <h2 id={id} className={titled ? "text-lg font-semibold" : "sr-only"}>
        {currencyLabel(report.currency)}
      </h2>
      {/* Phones: one ledger row per figure (label left, amount right). */}
      <dl className="grid rounded-xl border bg-background px-5 py-2 sm:grid-cols-3 sm:px-0 sm:py-0">
        {figures.map((f) => (
          <div
            key={f.label}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 border-t py-2.5 first:border-t-0 sm:block sm:border-t-0 sm:border-l sm:px-5 sm:py-4 sm:first:border-l-0"
          >
            <dt className={LABEL}>{f.label}</dt>
            <dd
              className={cn(
                "text-lg font-semibold tracking-[-0.02em] tabular-nums sm:mt-1 sm:text-2xl",
                f.settled && "text-success-ink",
              )}
            >
              {f.value}
            </dd>
            <dd className="col-span-2 text-sm text-muted-foreground tabular-nums">
              {f.note}
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-3">
        <h3 id={`${id}-clients`} className="text-[15px] font-semibold">
          By client
        </h3>
        <ClientTable
          id={`${id}-clients`}
          page={pageOf(report.clients, query.page)}
          totals={report}
          currency={report.currency}
          totalLabel={total}
          href={(n) => reportHref({ fy, page: n, client: query.client })}
          rowHref={(clientId) =>
            reportHref({
              fy,
              page: query.page,
              client: clientId,
              hash: `${id}-unpaid`,
            })
          }
        />
      </div>
      <UnpaidList
        id={`${id}-unpaid`}
        page={pageOf(unpaid, query.upage)}
        currency={report.currency}
        client={client?.name ?? null}
        allHref={reportHref({ fy, page: query.page, hash: `${id}-unpaid` })}
        href={(n) =>
          reportHref({
            fy,
            page: query.page,
            client: query.client,
            upage: n,
            hash: `${id}-unpaid`,
          })
        }
      />
      <div className="grid gap-3">
        <div className="grid gap-0.5">
          <h3 id={`${id}-months`} className="text-[15px] font-semibold">
            By month
          </h3>
          <p className="text-[13px] text-pretty text-muted-foreground">
            By the month the client approved. Received counts payments for those
            change requests, whenever they arrived.
          </p>
        </div>
        <MonthTable
          id={`${id}-months`}
          months={report.months}
          totals={report}
          currency={report.currency}
          totalLabel={total}
        />
      </div>
    </section>
  );
}
