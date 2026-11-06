import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProjectList } from "@/modules/projects";
import { listProjects } from "@/modules/projects/server";
import { Button } from "@/shared/ui/button";
import { EmptyState, ListSkeleton } from "@/shared/ui/list-states";
import { PageContainer, PageHeader } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
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
        <Projects />
      </Suspense>
    </PageContainer>
  );
}

async function Projects() {
  const projects = await listProjects();
  if (projects.length === 0) {
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
  return <ProjectList projects={projects} />;
}
