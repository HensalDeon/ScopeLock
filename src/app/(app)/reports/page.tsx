import type { Metadata } from "next";
import { Suspense } from "react";
import {
  parseFinancialYear,
  RecoveredReportView,
  ReportUpgrade,
} from "@/modules/reports";
import { getRecoveredReport } from "@/modules/reports/server";
import { parsePage } from "@/shared/lib/pagination";
import { ListSkeleton } from "@/shared/ui/list-states";
import { PageContainer } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Revenue recovered" };

export default function ReportsPage({ searchParams }: PageProps<"/reports">) {
  return (
    <PageContainer>
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <Report searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function Report({
  searchParams,
}: {
  searchParams: PageProps<"/reports">["searchParams"];
}) {
  const query = await searchParams;
  const result = await getRecoveredReport(parseFinancialYear(query.year));
  return result.kind === "upgrade" ? (
    <ReportUpgrade thisYear={result.thisYear} agency={result.agency} />
  ) : (
    <RecoveredReportView
      report={result.report}
      years={result.years}
      previous={result.previous}
      current={result.current}
      asOf={result.asOf}
      query={{
        page: parsePage(query.page),
        upage: parsePage(query.upage),
        client: parseObjectIdParam(query.client),
      }}
    />
  );
}

/** "?client=<24 hex>" or nothing. */
function parseObjectIdParam(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" && /^[0-9a-f]{24}$/.test(raw) ? raw : null;
}
