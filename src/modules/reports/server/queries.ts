import "server-only";
import { getPlans, getWorkspacePlan } from "@/modules/billing/server";
import { changeLabel } from "@/modules/changes";
import { listApprovedChangeTotals } from "@/modules/changes/server";
import { listReceivedChangeLines } from "@/modules/payments/server";
import { listProjectSummaries } from "@/modules/projects/server";
import { requireWorkspace } from "@/modules/workspace/server";
import { todayInIndia } from "@/shared/lib/dates";
import { formatINR } from "@/shared/lib/money";
import { recoveredCsv } from "../domain/csv";
import { financialYearLabel, financialYearOf } from "../domain/financial-year";
import {
  recoveredReport,
  reportYears,
  type RecoveredReport,
  type ReportProject,
  type ReportTotals,
} from "../domain/recovered-report";

export type RecoveredReportPage =
  /** Not on this plan: what it is, this year's totals, and the plan. */
  | {
      kind: "upgrade";
      /** This financial year so far, per currency. */
      thisYear: (ReportTotals & {
        currency: RecoveredReport["currencies"][number]["currency"];
      })[];
      agency: { name: string; price: string; projects: number } | null;
    }
  | {
      kind: "report";
      report: RecoveredReport;
      /** Years to switch to, newest first. */
      years: number[];
      /** The year before, when it has approvals and this one has none. */
      previous: { fy: number; count: number } | null;
    };

/** Everything the report reads, for one financial year. */
async function load(
  fy: (years: number[], counts: (fy: number) => number) => number,
) {
  const now = new Date();
  const [changes, received, projects] = await Promise.all([
    listApprovedChangeTotals(),
    listReceivedChangeLines(),
    listProjectSummaries(),
  ]);
  const years = reportYears(changes, now);
  const count = (y: number) =>
    changes.filter((c) => financialYearOf(c.approvedAt) === y).length;
  const year = fy(years, count);
  const report = recoveredReport({
    fy: year,
    now,
    changes: changes.map((c) => ({ ...c, label: changeLabel(c.number) })),
    received,
    projects: new Map<string, ReportProject>(
      projects.map((p) => [
        p.id,
        {
          name: p.name,
          clientId: p.clientId,
          clientName: p.client?.name ?? null,
        },
      ]),
    ),
  });
  return { report, years, count, now };
}

/** Agency: revenue recovered for one financial year (default: this one). */
export async function getRecoveredReport(
  requestedYear: number | null,
): Promise<RecoveredReportPage> {
  const { workspace } = await requireWorkspace();
  const { plan } = await getWorkspacePlan(workspace.workspaceId);
  const current = financialYearOf(new Date());

  if (!plan.features.recoveredReports) {
    const [{ report }, plans] = await Promise.all([
      load(() => current),
      getPlans(),
    ]);
    const agency = plans.find((p) => p.features.recoveredReports);
    return {
      kind: "upgrade",
      thisYear: report.currencies.map(
        ({ currency, count, approved, received, outstanding }) => ({
          currency,
          count,
          approved,
          received,
          outstanding,
        }),
      ),
      agency: agency
        ? {
            name: agency.name,
            price: formatINR(agency.monthlyPrice),
            projects: agency.activeProjects,
          }
        : null,
    };
  }

  const { report, years, count } = await load((ys, n) => {
    if (requestedYear !== null && ys.includes(requestedYear))
      return requestedYear;
    // Early in a new year (April), the one just closed is what people want.
    return n(current) === 0 && n(current - 1) > 0 ? current - 1 : current;
  });
  const before = report.fy - 1;
  return {
    kind: "report",
    report,
    years,
    previous:
      report.rows.length === 0 && count(before) > 0
        ? { fy: before, count: count(before) }
        : null,
  };
}

/** The year's CSV (Agency), or null on a plan without reports. */
export async function getRecoveredCsv(
  requestedYear: number | null,
): Promise<{ filename: string; body: string } | null> {
  const result = await getRecoveredReport(requestedYear);
  if (result.kind !== "report") return null;
  const year = financialYearLabel(result.report.fy).replace("–", "-");
  return {
    // "Received" keeps changing: the name says when it was taken.
    filename: `revenue-recovered-FY-${year}-as-of-${todayInIndia()}.csv`,
    // The byte-order mark makes Excel read ₹ and Indian names as UTF-8.
    body: `﻿${recoveredCsv(result.report.rows)}`,
  };
}
