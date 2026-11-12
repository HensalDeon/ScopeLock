import { Download } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { currencyLabel } from "@/shared/lib/currency";
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
import { ClientTable, MonthTable } from "./report-tables";

const LABEL =
  "font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase";
const changes = (n: number) => `${n} change request${n === 1 ? "" : "s"}`;

const yearHref = (fy: number, page = 1) =>
  `/reports?year=${fy}${page > 1 ? `&page=${page}` : ""}` as Route;

/**
 * Revenue recovered for one financial year (Agency): the year's figures,
 * who still owes what, and month by month, per currency, with the CSV.
 */
export function RecoveredReportView({
  report,
  years,
  page,
  previous,
}: {
  report: RecoveredReport;
  years: number[];
  /** Page of the by-client table. */
  page: number;
  /** The year before, when it has approvals (offered while this one is empty). */
  previous: { fy: number; count: number } | null;
}) {
  const year = `FY ${financialYearLabel(report.fy)}`;
  return (
    <>
      <PageHeader
        title="Revenue recovered"
        description="Change requests your clients approved, before GST, and how much of that has been paid. Approval isn't payment, so both are shown."
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
              href={yearHref(fy)}
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
                <Link href={yearHref(previous.fy)}>
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
          client and by month, with how much of it has been paid. Start one from
          a project&apos;s page with &ldquo;New change request&rdquo;.
        </EmptyState>
      ) : (
        <div className="grid max-w-5xl gap-12">
          {report.currencies.map((c) => (
            <CurrencySection
              key={c.currency}
              report={c}
              year={year}
              fy={report.fy}
              page={page}
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
  year,
  fy,
  page,
  titled,
}: {
  report: CurrencyReport;
  year: string;
  fy: number;
  page: number;
  /** More than one currency: name each. */
  titled: boolean;
}) {
  const money = (n: Parameters<typeof formatMoney>[0]) =>
    formatMoney(n, report.currency);
  const id = `recovered-${report.currency}`;
  const current = clampPage(page, report.clients.length);
  const clients = toPage(
    report.clients.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    report.clients.length,
    current,
  );
  const total = `Total, ${year}`;
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
        report.outstanding === 0 ? "Nothing left" : "Approved, not paid yet",
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
          page={clients}
          totals={report}
          currency={report.currency}
          totalLabel={total}
          href={(n) => yearHref(fy, n)}
        />
      </div>
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
