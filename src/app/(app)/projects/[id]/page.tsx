import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { clientFirstName } from "@/modules/clients";
import {
  DeleteProjectButton,
  isEditable,
  MilestoneTable,
  ProjectStatusBadge,
  ScopeTable,
} from "@/modules/projects";
import { getProjectOrNotFound } from "@/modules/projects/server";
import { formatDateTime } from "@/shared/lib/dates";
import { formatPhone } from "@/shared/lib/phone";
import { Button } from "@/shared/ui/button";
import { PageContainer } from "@/shared/ui/page";

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
}: {
  params: PageProps<"/projects/[id]">["params"];
}) {
  const { id } = await params;
  const project = await getProjectOrNotFound(id);
  const editable = isEditable(project.status);
  const client = project.client;

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <Link
          href="/projects"
          className="w-fit text-sm text-muted-foreground hover:text-foreground"
        >
          ← Projects
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid min-w-0 gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
                {project.name}
              </h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            {client && (
              <p className="text-[15px] text-muted-foreground">
                For{" "}
                <Link
                  href={`/clients/${client.id}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {client.name}
                </Link>
                {client.company ? ` · ${client.company}` : ""}
              </p>
            )}
          </div>
          {editable && (
            <Button asChild variant="outline">
              <Link href={`/projects/${project.id}/edit`}>
                <Pencil aria-hidden />
                Edit scope
              </Link>
            </Button>
          )}
        </div>
        {project.description && (
          <p className="max-w-prose text-[15px] leading-relaxed text-pretty">
            {project.description}
          </p>
        )}
      </div>

      {project.status === "draft" && (
        <div className="rounded-xl border border-dashed bg-canvas px-5 py-4 text-sm leading-relaxed text-pretty">
          <span className="font-medium">Draft.</span> Only you can see this.
          Next, you&apos;ll send the scope to{" "}
          {client ? clientFirstName(client) : "your client"} to approve. Once
          they do, it&apos;s locked, and anything extra becomes a priced change
          request.
        </div>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid gap-8">
          <section
            aria-labelledby={`scope-${project.id}`}
            className="grid gap-3"
          >
            <h2
              id={`scope-${project.id}`}
              className="text-[15px] font-semibold"
            >
              Agreed scope
            </h2>
            <ScopeTable project={project} />
          </section>
          <section
            aria-labelledby={`payments-${project.id}`}
            className="grid gap-3"
          >
            <h2
              id={`payments-${project.id}`}
              className="text-[15px] font-semibold"
            >
              Payment terms
            </h2>
            <MilestoneTable project={project} />
          </section>
        </div>

        <aside className="grid gap-4">
          {client && (
            <div className="rounded-xl border bg-canvas p-5">
              <h2 className="text-sm font-semibold">Client</h2>
              <dl className="mt-3 grid gap-2.5 text-sm">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{client.name}</dd>
                </div>
                {client.phone && (
                  <div>
                    <dt className="text-muted-foreground">WhatsApp</dt>
                    <dd className="font-medium tabular-nums">
                      {formatPhone(client.phone)}
                    </dd>
                  </div>
                )}
                {client.email && (
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="truncate font-medium">{client.email}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
          <p className="px-1 text-xs text-muted-foreground">
            Created {formatDateTime(project.createdAt)}
            {project.updatedAt.getTime() !== project.createdAt.getTime() &&
              ` · Updated ${formatDateTime(project.updatedAt)}`}
          </p>
          {editable && (
            <div className="px-1">
              <DeleteProjectButton
                projectId={project.id}
                projectName={project.name}
              />
            </div>
          )}
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
