import "server-only";
import {
  type ActivityItem,
  listLastReminders,
  listRecentActivity,
} from "@/modules/activity/server";
import { changeLabel } from "@/modules/changes";
import {
  listApprovedChangeTotals,
  listChanges,
  listOpenChanges,
} from "@/modules/changes/server";
import { countClients } from "@/modules/clients/server";
import { getInvoicing } from "@/modules/invoices/server";
import { hasAnyMethod, nextStep, stillToAsk } from "@/modules/payments";
import {
  getPaymentMethods,
  getProjectPayments,
  listOwedPayments,
  listReceivedChangeAmounts,
} from "@/modules/payments/server";
import {
  findProjectWithClient,
  getShareState,
  listProjectSummaries,
} from "@/modules/projects/server";
import { BUSINESS_TYPE_LABELS } from "@/modules/workspace";
import { minor } from "@/shared/lib/money";
import { requireWorkspace } from "@/modules/workspace/server";
import {
  waitingOnClients,
  type AttentionItem,
  type OverviewChange,
  type OverviewPayment,
  type ProjectMoneyFigures,
} from "../domain/overview";
import { nextReminderAt } from "@/modules/reminders";
import { needsYou } from "../domain/needs-you";
import {
  latestApproved,
  revenueRecovered,
  type RecoveredTotals,
} from "../domain/recovered";
import { setupSteps, type SetupStep } from "../domain/setup";
import {
  dueByClient,
  portfolioTotals,
  type CurrencyTotals,
} from "../domain/portfolio";

export type OverviewData = {
  /** The first-run checklist, or null once every step is done. */
  setup: SetupStep[] | null;
  /** The checklist was hidden by hand (it can be shown again). */
  setupHidden: boolean;
  hasProjects: boolean;
  money: CurrencyTotals[];
  /** Approved change requests: this month and all time, per currency. */
  recovered: RecoveredTotals[];
  /** The latest approved change, to name what "recovered" is made of. */
  recoveredLatest: {
    label: string;
    title: string;
    project: string;
    href: string;
    approvedAt: Date;
  } | null;
  waiting: AttentionItem[];
  needs: AttentionItem[];
  activity: (ActivityItem & {
    project: { name: string; href: string } | null;
  })[];
};

/** Everything the overview shows, for the signed-in workspace. */
export async function getOverview(): Promise<OverviewData> {
  const [
    { workspace },
    clientCount,
    changes,
    activity,
    owed,
    { methods },
    invoicing,
    projects,
    approvedChanges,
    reminded,
    receivedChanges,
  ] = await Promise.all([
    requireWorkspace(),
    countClients(),
    listOpenChanges(),
    listRecentActivity(6),
    listOwedPayments(),
    getPaymentMethods(),
    getInvoicing(),
    listProjectSummaries().then(withMoney),
    listApprovedChangeTotals(),
    listLastReminders(),
    listReceivedChangeAmounts(),
  ]);
  const payments: OverviewPayment[] = owed.flatMap((p) =>
    p.status === "due" || p.status === "client_reported"
      ? [
          {
            id: p.id,
            projectId: p.projectId,
            label: p.label,
            amount: p.payable,
            status: p.status,
            requestedAt: p.requestedAt,
            reportedAt: p.report?.reportedAt ?? null,
          },
        ]
      : [],
  );
  const steps = setupSteps({
    businessName: workspace.businessName,
    businessTypeTitle: BUSINESS_TYPE_LABELS[workspace.businessType].title,
    clientCount,
    paymentsReady: hasAnyMethod(methods),
    invoicingReady: Boolean(
      invoicing.settings.legalName ||
      invoicing.settings.address ||
      invoicing.settings.gstin,
    ),
    projects,
  });

  const open: OverviewChange[] = changes.map((c) => ({
    ...c,
    label: changeLabel(c.number),
  }));
  // Client links only for projects with something waiting (each is decrypted).
  const waitingIds = new Set([
    ...projects
      .filter((p) => p.status === "awaiting_approval")
      .map((p) => p.id),
    ...open.filter((c) => c.status === "sent").map((c) => c.projectId),
    ...payments.filter((p) => p.status === "due").map((p) => p.projectId),
  ]);
  const links = new Map(
    await Promise.all(
      [...waitingIds].map(
        async (id) => [id, (await getShareState(id)).url] as const,
      ),
    ),
  );
  const names = new Map(projects.map((p) => [p.id, p.name]));

  return {
    setup: steps.every((s) => s.done) ? null : steps,
    setupHidden: workspace.setupHidden,
    hasProjects: projects.length > 0,
    money: portfolioTotals(projects),
    recovered: revenueRecovered(approvedChanges, new Date(), receivedChanges),
    recoveredLatest: ((latest) =>
      latest
        ? {
            label: changeLabel(latest.number),
            title: latest.title,
            project: names.get(latest.projectId) ?? "a project",
            href: `/projects/${latest.projectId}/changes/${latest.number}`,
            approvedAt: latest.approvedAt,
          }
        : null)(latestApproved(approvedChanges)),
    waiting: waitingOnClients(
      projects,
      open,
      links,
      new Date(),
      payments,
      reminded,
      nextReminderAt,
    ),
    needs: needsYou(
      projects,
      open,
      new Date(),
      payments,
      hasAnyMethod(methods),
    ),
    activity: activity.map((a) => ({
      ...a,
      project: names.has(a.projectId)
        ? {
            name: names.get(a.projectId) ?? "",
            href: `/projects/${a.projectId}`,
          }
        : null,
    })),
  };
}

type Summary = Awaited<ReturnType<typeof listProjectSummaries>>[number];

/**
 * Approved projects get their money worked out exactly as the project page
 * does (schedule, GST, next step), so the overview can't disagree with it.
 * One schedule per approved project; plans cap these at a handful.
 */
async function withMoney(
  summaries: Summary[],
): Promise<(Summary & { money: ProjectMoneyFigures | null })[]> {
  return Promise.all(
    summaries.map(async (s) => {
      if (s.status !== "active" && s.status !== "completed")
        return { ...s, money: null };
      const [project, changes] = await Promise.all([
        findProjectWithClient(s.id),
        listChanges(s.id),
      ]);
      if (!project) return { ...s, money: null };
      const { items, totals } = await getProjectPayments(project, changes);
      const shown = totals.gst ?? totals;
      const step = nextStep(items);
      return {
        ...s,
        money: {
          received: shown.received,
          due: shown.due,
          toAsk: stillToAsk(items),
          total: shown.total,
          tax: totals.gst?.tax ?? minor(0),
          nextAsk:
            step?.kind === "ask"
              ? { label: step.item.label, amount: step.item.payable }
              : null,
        },
      };
    }),
  );
}

/**
 * One client's money, counted like the overview and each project strip:
 * received, due now, still to ask for, approved (with GST).
 */
export async function getClientMoney(
  clientId: string,
): Promise<CurrencyTotals[]> {
  const summaries = (await listProjectSummaries()).filter(
    (p) => p.clientId === clientId,
  );
  return portfolioTotals(await withMoney(summaries));
}

/** What each client owes now, per currency, for the clients list. */
export async function getDueByClient() {
  const [owed, projects] = await Promise.all([
    listOwedPayments(),
    listProjectSummaries(),
  ]);
  return dueByClient(
    owed.map((p) => ({
      projectId: p.projectId,
      amount: p.payable,
      currency: p.currency,
      status: p.status,
    })),
    new Map(projects.map((p) => [p.id, p.clientId])),
  );
}
