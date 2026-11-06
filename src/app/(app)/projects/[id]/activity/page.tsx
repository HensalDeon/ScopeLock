import type { Metadata, Route } from "next";
import { Suspense } from "react";
import { ActivityTimeline } from "@/modules/activity";
import { listProjectActivity } from "@/modules/activity/server";
import { getProjectOrNotFound } from "@/modules/projects/server";
import { parsePage } from "@/shared/lib/pagination";
import { BackLink } from "@/shared/ui/back-link";
import { ListSkeleton } from "@/shared/ui/list-states";
import { PageContainer, PageHeader } from "@/shared/ui/page";
import { Pagination } from "@/shared/ui/pagination";

export const metadata: Metadata = { title: "Project activity" };

export default function ProjectActivityPage({
  params,
  searchParams,
}: PageProps<"/projects/[id]/activity">) {
  return (
    <PageContainer>
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <Activity params={params} searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function Activity({
  params,
  searchParams,
}: Pick<PageProps<"/projects/[id]/activity">, "params" | "searchParams">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [project, activity] = await Promise.all([
    getProjectOrNotFound(id),
    listProjectActivity(id, { page: parsePage(query.page) }),
  ]);
  const base = `/projects/${project.id}`;
  return (
    <div className="grid gap-2">
      <BackLink href={base as Route} className="mb-1">
        Back to project
      </BackLink>
      <PageHeader
        title="Activity"
        description={`Everything that happened on ${project.name}, newest first.`}
      />
      <div className="grid max-w-3xl gap-6">
        <ActivityTimeline
          items={activity.items}
          visible={activity.items.length}
          empty="Sending, approvals and change requests will show here as they happen."
        />
        <Pagination
          page={activity}
          noun="events"
          href={(n) =>
            (n === 1
              ? `${base}/activity`
              : `${base}/activity?page=${n}`) as Route
          }
        />
      </div>
    </div>
  );
}
