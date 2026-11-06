import "server-only";
import {
  listRecentActivity,
  type ActivityItem,
} from "@/modules/activity/server";
import { changeLabel } from "@/modules/changes";
import { listOpenChanges } from "@/modules/changes/server";
import { countClients } from "@/modules/clients/server";
import { getShareState, listProjectSummaries } from "@/modules/projects/server";
import { BUSINESS_TYPE_LABELS } from "@/modules/workspace";
import { requireWorkspace } from "@/modules/workspace/server";
import {
  needsYou,
  setupSteps,
  waitingOnClients,
  type AttentionItem,
  type OverviewChange,
  type SetupStep,
} from "../domain/overview";
import { portfolioTotals, type CurrencyTotals } from "../domain/portfolio";

export type OverviewData = {
  /** The first-run checklist, or null once every step is done. */
  setup: SetupStep[] | null;
  hasProjects: boolean;
  money: CurrencyTotals[];
  waiting: AttentionItem[];
  needs: AttentionItem[];
  activity: (ActivityItem & {
    project: { name: string; href: string } | null;
  })[];
};

/** Everything the overview shows, for the signed-in workspace. */
export async function getOverview(): Promise<OverviewData> {
  const [{ workspace }, clientCount, projects, changes, activity] =
    await Promise.all([
      requireWorkspace(),
      countClients(),
      listProjectSummaries(),
      listOpenChanges(),
      listRecentActivity(6),
    ]);
  const steps = setupSteps({
    businessName: workspace.businessName,
    businessTypeTitle: BUSINESS_TYPE_LABELS[workspace.businessType].title,
    clientCount,
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
    hasProjects: projects.length > 0,
    money: portfolioTotals(projects),
    waiting: waitingOnClients(projects, open, links),
    needs: needsYou(projects, open),
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
