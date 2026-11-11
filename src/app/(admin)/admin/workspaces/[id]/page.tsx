import type { Route } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChangeLog } from "@/modules/admin";
import { listAdminChanges, requireAdmin } from "@/modules/admin/server";
import { WorkspacePlanForm, workspacePlanState } from "@/modules/billing";
import { getPlans, getWorkspacePlan } from "@/modules/billing/server";
import { countActiveProjects } from "@/modules/projects/server";
import { BUSINESS_TYPE_LABELS } from "@/modules/workspace";
import { findDirectoryEntry } from "@/shared/auth/directory";
import { formatDate } from "@/shared/lib/dates";
import { parsePage } from "@/shared/lib/pagination";
import { BackLink } from "@/shared/ui/back-link";
import { ListSkeleton } from "@/shared/ui/list-states";
import { PageContainer, PageHeader, Section } from "@/shared/ui/page";
import { Pagination } from "@/shared/ui/pagination";

export default function AdminWorkspacePage({
  params,
  searchParams,
}: PageProps<"/admin/workspaces/[id]">) {
  return (
    <PageContainer>
      <Suspense fallback={<ListSkeleton rows={4} />}>
        <Workspace params={params} searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function Workspace({
  params,
  searchParams,
}: {
  params: PageProps<"/admin/workspaces/[id]">["params"];
  searchParams: PageProps<"/admin/workspaces/[id]">["searchParams"];
}) {
  await requireAdmin();
  const { id } = await params;
  const entry = await findDirectoryEntry(id);
  if (!entry) notFound();
  const href = `/admin/workspaces/${id}`;
  const [{ plan, subscription }, plans, active, history] = await Promise.all([
    getWorkspacePlan(id),
    getPlans(),
    countActiveProjects(id),
    listAdminChanges(parsePage((await searchParams).page), { href }),
  ]);
  const state = workspacePlanState(subscription, plan, plans);
  const type =
    BUSINESS_TYPE_LABELS[
      entry.businessType as keyof typeof BUSINESS_TYPE_LABELS
    ]?.title ?? entry.businessType;
  const row = "grid gap-0.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4";
  return (
    <>
      <title>{`${entry.businessName} · ScopeLock admin`}</title>
      <BackLink href="/admin/workspaces" className="mb-4">
        Workspaces
      </BackLink>
      <PageHeader title={entry.businessName} />
      <Section title="Workspace">
        <dl className="grid gap-3 text-sm">
          <div className={row}>
            <dt className="text-muted-foreground">Owner</dt>
            <dd className="min-w-0 break-words">
              {entry.owner
                ? `${entry.owner.name} · ${entry.owner.email}`
                : "No owner found"}
            </dd>
          </div>
          <div className={row}>
            <dt className="text-muted-foreground">Works as</dt>
            <dd>{type}</dd>
          </div>
          <div className={row}>
            <dt className="text-muted-foreground">Started</dt>
            <dd className="tabular-nums">
              {formatDate(entry.createdAt, { withYear: true })}
            </dd>
          </div>
          <div className={row}>
            <dt className="text-muted-foreground">Active projects</dt>
            <dd className="tabular-nums">
              {active} of {plan.activeProjects} on {plan.name}
            </dd>
          </div>
        </dl>
      </Section>
      <Section
        title="Plan"
        description="Set a plan by hand for beta users, friends and comps. This never charges anyone or changes a Razorpay subscription."
      >
        <div className="grid gap-6">
          <p className="text-sm text-pretty">{state.summary}</p>
          {state.warning && (
            <p className="text-sm text-pretty text-warning-ink">
              {state.warning}
            </p>
          )}
          {state.canSet && (
            <WorkspacePlanForm
              workspaceId={id}
              workspaceName={entry.businessName}
              current={plan.id}
              savedNote={subscription.note}
              activeProjects={active}
              plans={plans}
            />
          )}
        </div>
      </Section>
      <Section
        title="History"
        description="Every plan change for this workspace, newest first. It can't be edited."
      >
        {history.total === 0 ? (
          <p className="text-sm text-muted-foreground">
            No plan changes made here yet. Payments through Razorpay are in the
            Razorpay dashboard.
          </p>
        ) : (
          <div className="grid gap-4">
            <ChangeLog entries={history.items} />
            <Pagination
              page={history}
              noun="changes"
              href={(n) => `${href}?page=${n}` as Route}
            />
          </div>
        )}
      </Section>
    </>
  );
}
