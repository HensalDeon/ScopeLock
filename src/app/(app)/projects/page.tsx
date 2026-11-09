import { Plus } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProjectList } from "@/modules/projects";
import { listProjects } from "@/modules/projects/server";
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
      <Suspense fallback={<ListSkeleton rows={3} />}>
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
  const page = await listProjects(parsePage(query.page), search);
  const searchBox = (
    <SearchBox
      action="/projects"
      value={search}
      label="Search projects"
      placeholder="Project or client name"
    />
  );
  if (search && page.total === 0) {
    return (
      <div className="grid gap-4">
        {searchBox}
        <EmptyState title={`No projects match “${search}”`}>
          Try part of the project&apos;s name or your client&apos;s name.
        </EmptyState>
      </div>
    );
  }
  if (page.total === 0) {
    return (
      <EmptyState
        title="No projects yet"
        action={
          // The header's New project is the one filled button.
          <Button asChild variant="outline">
            <Link href="/projects/new">Create your first project</Link>
          </Button>
        }
      >
        Write down what you agreed with your client, like a 5-page website for
        ₹80,000 paid 30/30/40. Once they approve it, every extra request gets
        priced against this scope.
      </EmptyState>
    );
  }
  return (
    <div className="grid gap-4">
      {searchBox}
      <ProjectList projects={page.items} />
      <Pagination
        page={page}
        noun="projects"
        href={(n) => listHref("/projects", { q: search, page: n }) as Route}
      />
    </div>
  );
}
