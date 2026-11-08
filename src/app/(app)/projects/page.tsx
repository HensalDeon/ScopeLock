import { Plus } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProjectList } from "@/modules/projects";
import { listProjects } from "@/modules/projects/server";
import { Button } from "@/shared/ui/button";
import { parsePage } from "@/shared/lib/pagination";
import { EmptyState, ListSkeleton } from "@/shared/ui/list-states";
import { PageContainer, PageHeader } from "@/shared/ui/page";
import { Pagination } from "@/shared/ui/pagination";

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
  const page = await listProjects(parsePage((await searchParams).page));
  if (page.total === 0) {
    return (
      <EmptyState
        title="No projects yet"
        action={
          <Button asChild>
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
      <ProjectList projects={page.items} />
      <Pagination
        page={page}
        noun="projects"
        href={(n) => (n === 1 ? "/projects" : (`/projects?page=${n}` as Route))}
      />
    </div>
  );
}
