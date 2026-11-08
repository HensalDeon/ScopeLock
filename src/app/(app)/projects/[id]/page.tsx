import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActivityTimeline } from "@/modules/activity";
import { listProjectActivity } from "@/modules/activity/server";
import { ApprovalRows } from "@/modules/approvals";
import { listApprovalsForProject } from "@/modules/approvals/server";
import { ChangeList, changeSummary } from "@/modules/changes";
import { listChanges } from "@/modules/changes/server";
import { gstHints } from "@/modules/invoices";
import { getInvoicing } from "@/modules/invoices/server";
import { hasAnyMethod, PaymentsPanel } from "@/modules/payments";
import {
  getPaymentMethods,
  getProjectPayments,
} from "@/modules/payments/server";
import { clientFirstName } from "@/modules/clients";
import {
  isScopeApproved,
  MilestoneTable,
  ProjectHeader,
  ProjectSidebar,
  proposalShareMessage,
  ScopeTable,
  unlockingSteps,
  SharePanel,
} from "@/modules/projects";
import { getProjectOrNotFound, getShareState } from "@/modules/projects/server";
import { requireWorkspace } from "@/modules/workspace/server";
import { formatMoney, minor } from "@/shared/lib/money";
import { PageContainer, TitledSection } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Project" };

/** The project page shows the latest few; the rest have their own pages. */
const ACTIVITY_SHOWN = 5;
const ANSWERS_SHOWN = 3;

function SeeAll({
  href,
  total,
  shown,
}: {
  href: string;
  total: number;
  shown: number;
}) {
  if (total <= shown) return null;
  return (
    <Link
      href={href as Route}
      className="text-sm font-medium underline-offset-4 hover:underline"
    >
      See all {total}
    </Link>
  );
}

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
      listApprovalsForProject(id, { pageSize: ANSWERS_SHOWN }),
      listChanges(id),
      listProjectActivity(id, { pageSize: ACTIVITY_SHOWN }),
      requireWorkspace(),
    ]);
  const approved = isScopeApproved(project.status);
  const [payments, { methods }, invoicing] = approved
    ? await Promise.all([
        getProjectPayments(project, changes),
        getPaymentMethods(),
        getInvoicing(),
      ])
    : [null, { methods: null }, null];
  const gst = gstHints(
    invoicing?.settings ?? { gstin: null, state: null },
    project.client,
  );
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
          {payments ? (
            <TitledSection id={`payments-${project.id}`} title="Payments">
              <PaymentsPanel
                projectId={project.id}
                projectName={project.name}
                currency={project.currency}
                items={payments.items}
                totals={payments.totals}
                portalUrl={share.url}
                client={{ firstName, phone: project.client?.phone ?? null }}
                methodsReady={methods ? hasAnyMethod(methods) : false}
                unlockedBy={unlockingSteps(project)}
                gst={
                  invoicing
                    ? { seller: invoicing.settings, buyer: project.client }
                    : null
                }
                stateFallback={
                  gst.fallbackState && project.client
                    ? {
                        yourState: gst.fallbackState,
                        clientHref: `/clients/${project.client.id}`,
                      }
                    : null
                }
              />
            </TitledSection>
          ) : (
            <TitledSection id={`payments-${project.id}`} title="Payment terms">
              <MilestoneTable project={project} />
            </TitledSection>
          )}
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
          <TitledSection
            id={`activity-${project.id}`}
            title="Activity"
            action={
              <SeeAll
                href={`/projects/${project.id}/activity`}
                total={activity.total}
                shown={activity.items.length}
              />
            }
          >
            <ActivityTimeline
              items={activity.items}
              visible={ACTIVITY_SHOWN}
              quotes="clamped"
              empty="Sending, approvals and change requests will show here as they happen."
            />
          </TitledSection>
          {approvals.total > 0 && (
            <TitledSection
              id={`answers-${project.id}`}
              title="Client answers"
              action={
                <SeeAll
                  href={`/projects/${project.id}/answers`}
                  total={approvals.total}
                  shown={approvals.items.length}
                />
              }
            >
              <ApprovalRows
                approvals={approvals.items}
                projectId={project.id}
              />
            </TitledSection>
          )}
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
