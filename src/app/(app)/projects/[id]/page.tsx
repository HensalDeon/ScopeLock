import type { Metadata } from "next";
import { Suspense } from "react";
import { ActivityTimeline } from "@/modules/activity";
import { listProjectActivity } from "@/modules/activity/server";
import { ApprovalHistory } from "@/modules/approvals";
import { listApprovalsForProject } from "@/modules/approvals/server";
import {
  ChangeList,
  changeSummary,
  scheduleAdditions,
} from "@/modules/changes";
import { listChanges } from "@/modules/changes/server";
import { clientFirstName } from "@/modules/clients";
import {
  isScopeApproved,
  MilestoneTable,
  ProjectHeader,
  ProjectSidebar,
  proposalShareMessage,
  ScopeTable,
  SharePanel,
} from "@/modules/projects";
import { getProjectOrNotFound, getShareState } from "@/modules/projects/server";
import { requireWorkspace } from "@/modules/workspace/server";
import { formatMoney, minor } from "@/shared/lib/money";
import { PageContainer, TitledSection } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Project" };

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <PageContainer>
      <Suspense fallback={<ProjectSkeleton />}>
        <ProjectDetail params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function ProjectDetail({
  params,
}: Pick<PageProps<"/projects/[id]">, "params">) {
  const { id } = await params;
  const [project, share, approvals, changes, activity, { user }] =
    await Promise.all([
      getProjectOrNotFound(id),
      getShareState(id),
      listApprovalsForProject(id),
      listChanges(id),
      listProjectActivity(id),
      requireWorkspace(),
    ]);
  const approved = isScopeApproved(project.status);
  const firstName = project.client
    ? clientFirstName(project.client)
    : "your client";

  return (
    <div className="grid gap-8">
      <ProjectHeader project={project} hasLink={share.hasLink} />

      {/* Phones: the share card first (it's the main action). Desktop: it
          sits top-right, with the client card below it. */}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:grid-rows-[auto_1fr] lg:gap-y-4">
        <div className="lg:col-start-2 lg:row-start-1">
          <SharePanel
            projectId={project.id}
            status={project.status}
            url={share.url}
            hasLink={share.hasLink}
            sentAt={share.sentAt}
            lastDecision={project.lastDecision}
            emailVerified={user.emailVerified}
            client={{ firstName, phone: project.client?.phone ?? null }}
            message={proposalShareMessage({
              clientFirstName: firstName,
              projectName: project.name,
              total: formatMoney(
                minor(share.sentTotal ?? project.baseline.total),
                project.currency,
              ),
            })}
          />
        </div>

        <div className="grid gap-8 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <TitledSection id={`scope-${project.id}`} title="Agreed scope">
            <ScopeTable
              project={project}
              changes={approved ? changeSummary(changes) : undefined}
            />
          </TitledSection>
          <TitledSection id={`payments-${project.id}`} title="Payment terms">
            <MilestoneTable
              project={project}
              additions={scheduleAdditions(project.milestones, changes)}
            />
          </TitledSection>
          {approved && (
            <ChangeList
              projectId={project.id}
              changes={changes}
              currency={project.currency}
              canCreate={project.status === "active"}
              addons={project.proposal.addons}
              headingId={`changes-${project.id}`}
            />
          )}
          <TitledSection id={`activity-${project.id}`} title="Activity">
            <ActivityTimeline
              items={activity}
              empty="Sending, approvals and change requests will show here as they happen."
            />
          </TitledSection>
          <ApprovalHistory
            approvals={approvals}
            headingId={`answers-${project.id}`}
            projectId={project.id}
          />
        </div>

        <aside className="grid gap-4 lg:col-start-2 lg:row-start-2">
          <ProjectSidebar project={project} />
        </aside>
      </div>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div aria-hidden className="grid gap-8">
      <div className="grid gap-3">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-7 w-64 rounded bg-muted" />
        <div className="h-4 w-40 rounded bg-muted/70" />
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="h-72 rounded-xl border bg-background" />
        <div className="h-44 rounded-xl border bg-canvas" />
      </div>
    </div>
  );
}
