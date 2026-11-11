import { Plus } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProjectList } from "@/modules/projects";
import { getWorkspacePlan } from "@/modules/billing/server";
import {
  countActiveProjects,
  countArchivedProjects,
  listProjects,
} from "@/modules/projects/server";
import { requireWorkspace } from "@/modules/workspace/server";
import { Button } from "@/shared/ui/button";
import { parsePage } from "@/shared/lib/pagination";
import { listHref, parseSearch } from "@/shared/lib/search";
import { EmptyState, ListSkeleton } from "@/shared/ui/list-states";
import { PageContainer, PageHeader } from "@/shared/ui/page";
import { Pagination } from "@/shared/ui/pagination";
import { SearchBox } from "@/shared/ui/search-box";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Each project holds the scope your client agreed to, and every change after it."
        actions={
          <Button asChild>
            <Link href="/projects/new">
              <Plus aria-hidden />
              New project
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<ListSkeleton rows={3} search />}>
        <Projects searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function Projects({
  searchParams,
}: {
  searchParams: PageProps<"/projects">["searchParams"];
}) {
  const query = await searchParams;
  const search = parseSearch(query.q);
  const archived = query.view === "archived";
  const { workspace } = await requireWorkspace();
  const [page, archivedCount, { plan }, active] = await Promise.all([
    listProjects(parsePage(query.page), search, archived),
    archived ? Promise.resolve(0) : countArchivedProjects(),
    getWorkspacePlan(workspace.workspaceId),
    countActiveProjects(workspace.workspaceId),
  ]);
  const view = archived ? "archived" : null;
  const href = (n: number) =>
    listHref("/projects", { view, q: search, page: n }) as Route;
  const searchBox = (search || page.total > 0) && (
    <SearchBox
      action="/projects"
      value={search}
      label={archived ? "Search archived projects" : "Search projects"}
      placeholder="Project or client name"
      hidden={archived ? { view: "archived" } : {}}
    />
  );
  const noMatch = search && page.total === 0 && (
    <EmptyState title={`No projects match “${search}”`}>
      Try part of the project&apos;s name or your client&apos;s name.
    </EmptyState>
  );

  if (archived) {
    return (
      <div className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold">Archived projects</h2>
          <Link
            href="/projects"
            className="text-sm font-medium underline-offset-4 hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
          >
            Back to active projects
          </Link>
        </div>
        {searchBox}
        {page.total > 0 ? (
          <ProjectList projects={page.items} />
        ) : (
          noMatch || (
            <EmptyState title="No archived projects">
              Projects you archive are kept here, read-only, with their scope,
              changes and payments. Restore one from its page.
            </EmptyState>
          )
        )}
        <Pagination page={page} noun="archived projects" href={href} />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground tabular-nums">
        {active} of {plan.activeProjects} active projects on {plan.name}, drafts
        included.{" "}
        <Link
          href="/settings/plan"
          className="font-medium text-foreground underline-offset-4 hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
        >
          Plan &amp; usage
        </Link>
      </p>
      {searchBox}
      {page.total > 0 ? (
        <ProjectList projects={page.items} />
      ) : (
        noMatch || (
          <EmptyState
            title="No projects yet"
            action={
              // The header's New project is the one filled button.
              <Button asChild variant="outline">
                <Link href="/projects/new">Create your first project</Link>
              </Button>
            }
          >
            Write down what you agreed with your client, like a 5-page website
            for ₹80,000 paid 30/30/40. Once they approve it, every extra request
            gets priced against this scope.
          </EmptyState>
        )
      )}
      <Pagination page={page} noun="projects" href={href} />
      {archivedCount > 0 && (
        <Link
          href="/projects?view=archived"
          className="justify-self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
        >
          Archived projects ({archivedCount})
        </Link>
      )}
    </div>
  );
}
