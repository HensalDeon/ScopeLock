import type { Metadata, Route } from "next";
import { Suspense } from "react";
import { ApprovalCards } from "@/modules/approvals";
import { listApprovalsForProject } from "@/modules/approvals/server";
import { getProjectOrNotFound } from "@/modules/projects/server";
import { parsePage } from "@/shared/lib/pagination";
import { BackLink } from "@/shared/ui/back-link";
import { EmptyState, ListSkeleton } from "@/shared/ui/list-states";
import { PageContainer, PageHeader } from "@/shared/ui/page";
import { Pagination } from "@/shared/ui/pagination";

export const metadata: Metadata = { title: "Signed records" };

export default function ProjectAnswersPage({
  params,
  searchParams,
}: PageProps<"/projects/[id]/answers">) {
  return (
    <PageContainer>
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <Answers params={params} searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function Answers({
  params,
  searchParams,
}: Pick<PageProps<"/projects/[id]/answers">, "params" | "searchParams">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [project, answers] = await Promise.all([
    getProjectOrNotFound(id),
    listApprovalsForProject(id, { page: parsePage(query.page) }),
  ]);
  const base = `/projects/${project.id}`;
  return (
    <div className="grid gap-2">
      <BackLink href={base as Route} className="mb-1">
        Back to project
      </BackLink>
      <PageHeader
        title="Client answers"
        description={`Every approval and "no" on ${project.name}, each a signed record of exactly what the client saw. Each record is checked against its signature when this page loads.`}
      />
      <div className="grid max-w-3xl gap-6">
        {answers.total > 0 ? (
          <ApprovalCards approvals={answers.items} projectId={project.id} />
        ) : (
          <EmptyState title="No answers yet">
            When your client approves the proposal or a change request, or asks
            for changes, the signed record appears here.
          </EmptyState>
        )}
        <Pagination
          page={answers}
          noun="answers"
          href={(n) =>
            (n === 1 ? `${base}/answers` : `${base}/answers?page=${n}`) as Route
          }
        />
      </div>
    </div>
  );
}
