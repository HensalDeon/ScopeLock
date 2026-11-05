import type { Metadata } from "next";
import { Suspense } from "react";
import { clientLabel } from "@/modules/clients";
import { listClients } from "@/modules/clients/server";
import { ProjectForm } from "@/modules/projects";
import { FreshOnEachVisit } from "@/shared/ui/fresh-on-each-visit";
import { PageContainer, PageHeader } from "@/shared/ui/page";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage({
  searchParams,
}: PageProps<"/projects/new">) {
  return (
    <PageContainer>
      <PageHeader
        title="New project"
        description="Write down the scope you agreed with your client. You'll send it to them for approval next."
      />
      <Suspense fallback={<div className="h-[36rem] rounded-xl bg-canvas" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function Form({
  searchParams,
}: {
  searchParams: PageProps<"/projects/new">["searchParams"];
}) {
  const [{ client }, clients] = await Promise.all([
    searchParams,
    listClients(),
  ]);
  const preselected =
    typeof client === "string" && clients.some((c) => c.id === client)
      ? client
      : clients.length === 1
        ? (clients[0]?.id ?? "")
        : "";

  return (
    <FreshOnEachVisit>
      <ProjectForm
        mode="create"
        clients={clients.map((c) => ({ id: c.id, label: clientLabel(c) }))}
        cancelHref="/projects"
        defaults={{
          clientId: preselected,
          name: "",
          description: "",
          items: [],
          billingModel: "milestones",
          milestones: [],
        }}
      />
    </FreshOnEachVisit>
  );
}
