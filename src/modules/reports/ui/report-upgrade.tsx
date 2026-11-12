import Link from "next/link";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney } from "@/shared/lib/money";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page";
import { financialYearLabel, financialYearOf } from "../domain/financial-year";
import type { ReportTotals } from "../domain/recovered-report";

const changes = (n: number) => `${n} change request${n === 1 ? "" : "s"}`;

/**
 * Reports, on a plan without them: this year's own totals (already on the
 * overview), what the full report adds, and the plan that has it.
 */
export function ReportUpgrade({
  thisYear,
  agency,
}: {
  thisYear: (ReportTotals & { currency: CurrencyCode })[];
  agency: { name: string; price: string; projects: number } | null;
}) {
  const year = `FY ${financialYearLabel(financialYearOf(new Date()))}`;
  return (
    <>
      <PageHeader
        title="Revenue recovered"
        description={`The full report, by client and by month with a CSV, is on the ${agency?.name ?? "Agency"} plan.`}
      />
      <div className="grid max-w-prose gap-5 rounded-xl border bg-background px-5 py-5">
        <p className="text-sm text-pretty">
          {thisYear.length === 0
            ? `No change requests approved in ${year} yet. When clients approve them, their prices add up on your overview.`
            : `${year} so far: ${thisYear
                .map(
                  (t) =>
                    `${formatMoney(t.approved, t.currency)} approved across ${changes(t.count)}, ${formatMoney(t.received, t.currency)} received`,
                )
                .join("; ")}.`}
        </p>
        <div className="grid gap-2">
          <p className="text-sm font-medium">
            The report adds, for each financial year:
          </p>
          <ul className="grid list-disc gap-1.5 pl-5 text-sm text-pretty text-muted-foreground">
            <li>
              Client by client: what each approved, what they&apos;ve paid and
              what they still owe.
            </li>
            <li>
              Month by month, April to March, with how much of each month has
              been paid.
            </li>
            <li>
              A CSV of every approved change request (date, CR number, title,
              project, client, amount before GST, received) for your accountant
              or a spreadsheet.
            </li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button asChild>
            <Link href="/settings/plan">
              See the {agency?.name ?? "Agency"} plan
            </Link>
          </Button>
          {agency && (
            <p className="text-sm text-muted-foreground tabular-nums">
              {agency.price} a month, {agency.projects} active projects
            </p>
          )}
        </div>
      </div>
    </>
  );
}
