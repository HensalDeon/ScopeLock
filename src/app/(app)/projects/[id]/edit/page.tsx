import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { clientLabel } from "@/modules/clients";
import { listClients } from "@/modules/clients/server";
import { isEditable, ProjectForm } from "@/modules/projects";
import { getProjectOrNotFound } from "@/modules/projects/server";
import { paiseToRupees } from "@/shared/lib/money";
import { PageContainer, PageHeader } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Edit project" };

export default function EditProjectPage({
  params,
}: PageProps<"/projects/[id]/edit">) {
  return (
    <PageContainer>
      <PageHeader title="Edit project" />
      <Suspense fallback={<div className="h-[36rem] rounded-xl bg-canvas" />}>
        <Form params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function Form({
  params,
}: {
  params: PageProps<"/projects/[id]/edit">["params"];
}) {
  const { id } = await params;
  const [project, clients] = await Promise.all([
    getProjectOrNotFound(id),
    listClients(),
  ]);
  if (!isEditable(project.status)) redirect(`/projects/${project.id}`);

  // Keep an archived client selectable on its own project.
  const options = clients.map((c) => ({ id: c.id, label: clientLabel(c) }));
  if (project.client && !options.some((o) => o.id === project.clientId)) {
    options.push({
      id: project.clientId,
      label: `${clientLabel(project.client)} (archived)`,
    });
  }

  return (
    <ProjectForm
      // Fresh from the database after every save; a draft in progress is
      // kept if the person navigates away and back without saving.
      key={project.updatedAt.getTime()}
      mode="edit"
      projectId={project.id}
      clients={options}
      cancelHref={`/projects/${project.id}` as Route}
      defaults={{
        clientId: project.clientId,
        name: project.name,
        description: project.description ?? "",
        items: project.baseline.items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description ?? "",
          amount: String(paiseToRupees(item.amount)),
        })),
        billingModel: project.billingModel,
        milestones: project.milestones.map((m) => ({
          id: m.id,
          name: m.name,
          percent: String(m.percent),
        })),
      }}
    />
  );
}
