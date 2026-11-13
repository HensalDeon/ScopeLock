import { Download } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/list-states";
import { PageHeader } from "@/shared/ui/page";
import { TOUCH_LINK } from "@/shared/ui/touch";
import { financialYearLabel } from "../domain/financial-year";
import type { RecoveredReport } from "../domain/recovered-report";
import { CurrencySection } from "./currency-section";
import { reportHref } from "./report-href";

const changes = (n: number) => `${n} change request${n === 1 ? "" : "s"}`;

export type Query = {
  /** Page numbers by param name (?p-inr=2, ?u-inr=3). */
  pages: Record<string, number>;
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
  // The chosen client's name, from whichever currency they bill in.
  const clientName = query.client
    ? (report.rows.find((r) => r.clientId === query.client)?.clientName ?? null)
    : null;
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
        <div className="grid max-w-5xl gap-4">
          <p className="text-sm text-muted-foreground">
            {current
              ? `${year} so far, as of ${formatDate(asOf, { now: asOf })}.`
              : `${year}: 1 April ${report.fy} to 31 March ${report.fy + 1}.`}
          </p>
          <div className="grid gap-12">
            {report.currencies.map((c) => (
              <CurrencySection
                key={c.currency}
                report={c}
                rows={report.rows}
                year={year}
                fy={report.fy}
                query={query}
                titled={report.currencies.length > 1}
                clientName={clientName}
                now={asOf}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
