import type { Metadata } from "next";
import { Suspense } from "react";
import { listProjectActivity } from "@/modules/activity/server";
import { listApprovalsForProject } from "@/modules/approvals/server";
import { ChangeList, changeSummary } from "@/modules/changes";
import { listChanges } from "@/modules/changes/server";
import { clientFirstName } from "@/modules/clients";
import {
  PaymentsPanel,
  ProjectMoneyStrip,
  type ScheduleRowContext,
} from "@/modules/payments";
import { getProjectMoney } from "@/modules/payments/server";
import {
  isScopeApproved,
  MilestoneTable,
  ProjectHeader,
  ProjectSidebar,
  ProjectSkeleton,
  ScopeTable,
  shareMessage,
  SharePanel,
  unlockingSteps,
} from "@/modules/projects";
import { getProjectOrNotFound, getShareState } from "@/modules/projects/server";
import { requireWorkspace } from "@/modules/workspace/server";
import { formatMoney, minor } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { PageContainer, TitledSection } from "@/shared/ui/page";
import { ProjectHistory } from "./_components/project-history";

export const metadata: Metadata = { title: "Project" };

/** The project page shows the latest few; the rest have their own pages. */
const ACTIVITY_SHOWN = 5;
const ANSWERS_SHOWN = 3;

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <PageContainer>
      <Suspense fallback={<ProjectSkeleton />}>
        <ProjectDetail params={params} />
      </Suspense>
    </PageContainer>
  );
}

/**
 * Ordered by phase: while the proposal is a draft or waiting, the scope
 * comes first; once approved, the money does (strip, payments, changes),
 * with the settled scope folded under its totals.
 */
async function ProjectDetail({
  params,
}: Pick<PageProps<"/projects/[id]">, "params">) {
  const { id } = await params;
  const [project, share, approvals, changes, activity, { user }] =
    await Promise.all([
      getProjectOrNotFound(id),
      getShareState(id),
      listApprovalsForProject(id, { pageSize: ANSWERS_SHOWN }),
      listChanges(id),
      listProjectActivity(id, { pageSize: ACTIVITY_SHOWN }),
      requireWorkspace(),
    ]);
  const approved = isScopeApproved(project.status);
  const money = approved
    ? await getProjectMoney(project, project.client, changes)
    : null;
  const client = {
    firstName: project.client ? clientFirstName(project.client) : "your client",
    phone: project.client?.phone ?? null,
    email: project.client?.email ?? null,
  };
  const ctx: ScheduleRowContext | null = money && {
    projectId: project.id,
    projectName: project.name,
    currency: project.currency,
    client,
    portalUrl: share.url,
    unlockedBy: unlockingSteps(project),
    stateFallback: money.stateFallback,
    exportCheck: money.exportCheck,
  };

  const scope = (
    <TitledSection id={`scope-${project.id}`} title="Agreed scope">
      <ScopeTable
        project={project}
        changes={approved ? changeSummary(changes) : undefined}
        gst={money?.totals.gst}
        folded={approved}
      />
    </TitledSection>
  );
  const payments =
    money && ctx ? (
      <TitledSection id={`payments-${project.id}`} title="Payments">
        <PaymentsPanel
          items={money.items}
          methodsReady={money.methodsReady}
          {...ctx}
        />
      </TitledSection>
    ) : (
      <TitledSection id={`payments-${project.id}`} title="Payment terms">
        <MilestoneTable project={project} />
      </TitledSection>
    );

  return (
    <div className="grid gap-8">
      <ProjectHeader project={project} hasLink={share.hasLink} />
      {money && ctx && (
        <ProjectMoneyStrip
          items={money.items}
          totals={money.totals}
          ctx={ctx}
          now={money.now}
        />
      )}

      {/* Desktop: the share card top-right, the client card below it, the
          history under the main column. Phones: the share card first while
          the proposal is out; once approved it follows payments and changes,
          before the history. */}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:grid-rows-[auto_1fr_auto] lg:gap-y-4">
        <div
          className={cn(
            "lg:col-start-2 lg:row-start-1",
            approved && "max-lg:order-1",
          )}
        >
          <SharePanel
            projectId={project.id}
            status={project.status}
            url={share.url}
            hasLink={share.hasLink}
            sentAt={share.sentAt}
            lastDecision={project.lastDecision}
            emailVerified={user.emailVerified}
            client={client}
            message={shareMessage({
              status: project.status,
              clientFirstName: client.firstName,
              projectName: project.name,
              total: formatMoney(
                minor(share.sentTotal ?? project.baseline.total),
                project.currency,
              ),
            })}
          />
        </div>

        <div className="grid gap-8 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {approved ? (
            <>
              {payments}
              <ChangeList
                projectId={project.id}
                changes={changes}
                currency={project.currency}
                canCreate={project.status === "active"}
                addons={project.proposal.addons}
                headingId={`changes-${project.id}`}
              />
              {scope}
            </>
          ) : (
            <>
              {scope}
              {payments}
            </>
          )}
        </div>

        <div
          className={cn(
            "grid gap-8 lg:col-start-1 lg:row-start-3 lg:mt-4",
            approved && "max-lg:order-2",
          )}
        >
          <ProjectHistory
            projectId={project.id}
            activity={activity}
            activityShown={ACTIVITY_SHOWN}
            approvals={approvals}
          />
        </div>

        <aside
          className={cn(
            "grid gap-4 lg:col-start-2 lg:row-start-2",
            approved && "max-lg:order-3",
          )}
        >
          <ProjectSidebar project={project} />
        </aside>
      </div>
    </div>
  );
}
