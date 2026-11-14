import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { listClients } from "@/modules/clients/server";
import { getGstRule } from "@/modules/invoices/server";
import { getDocumentSettings } from "@/modules/documents/server";
import {
  clientOptions,
  isEditable,
  ProjectForm,
  projectFormValues,
} from "@/modules/projects";
import { getProjectOrNotFound } from "@/modules/projects/server";
import { requireWorkspace } from "@/modules/workspace/server";
import { BackLink } from "@/shared/ui/back-link";
import { PageContainer, PageHeader } from "@/shared/ui/page";

// The title names the project (set with the form, once it's loaded).
export const metadata: Metadata = {};

export default function EditProjectPage({
  params,
}: PageProps<"/projects/[id]/edit">) {
  return (
    <PageContainer>
      <div className="mb-3">
        <Suspense fallback={<BackLink href="/projects">Projects</BackLink>}>
          <BackToProject params={params} />
        </Suspense>
      </div>
      <Suspense fallback={<div className="h-[36rem] rounded-xl bg-canvas" />}>
        <Form params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function BackToProject({
  params,
}: {
  params: PageProps<"/projects/[id]/edit">["params"];
}) {
  const { id } = await params;
  return (
    <BackLink href={`/projects/${encodeURIComponent(id)}` as Route}>
      Back to project
    </BackLink>
  );
}

async function Form({
  params,
}: {
  params: PageProps<"/projects/[id]/edit">["params"];
}) {
  const { id } = await params;
  const [project, clients, settings, { workspace }, gstFor] = await Promise.all(
    [
      getProjectOrNotFound(id),
      listClients(),
      getDocumentSettings(),
      requireWorkspace(),
      getGstRule(),
    ],
  );
  if (!isEditable(project.status) || project.archivedAt)
    redirect(`/projects/${project.id}`);

  return (
    <>
      <title>{`Edit ${project.name} · ScopeLock`}</title>
      <PageHeader title={`Edit ${project.name}`} />
      <ProjectForm
        // Fresh from the database after every save; a draft in progress is
        // kept if the person navigates away and back without saving.
        key={project.updatedAt.getTime()}
        mode="edit"
        projectId={project.id}
        clients={clientOptions(clients, project, gstFor)}
        defaultCurrency={workspace.currency}
        newClientGst={gstFor({ state: null, country: null, gstin: null })}
        cancelHref={`/projects/${project.id}` as Route}
        defaults={projectFormValues(project, settings.defaults)}
      />
    </>
  );
}
