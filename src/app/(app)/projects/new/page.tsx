import type { Metadata } from "next";
import { Suspense } from "react";
import { listClients } from "@/modules/clients/server";
import { getDocumentSettings } from "@/modules/documents/server";
import {
  clientOptions,
  newProjectValues,
  ProjectForm,
} from "@/modules/projects";
import { FreshOnEachVisit } from "@/shared/ui/fresh-on-each-visit";
import { requireWorkspace } from "@/modules/workspace/server";
import { BackLink } from "@/shared/ui/back-link";
import { PageContainer, PageHeader } from "@/shared/ui/page";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage({
  searchParams,
}: PageProps<"/projects/new">) {
  return (
    <PageContainer>
      <BackLink href="/projects" className="mb-3">
        Projects
      </BackLink>
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
  const [{ client }, clients, settings, { workspace }] = await Promise.all([
    searchParams,
    listClients(),
    getDocumentSettings(),
    requireWorkspace(),
  ]);
  return (
    <FreshOnEachVisit>
      <ProjectForm
        mode="create"
        clients={clientOptions(clients)}
        defaultCurrency={workspace.currency}
        cancelHref="/projects"
        defaults={newProjectValues({
          clients,
          requestedClientId: client,
          workspaceCurrency: workspace.currency,
          proposalDefaults: settings.defaults,
        })}
      />
    </FreshOnEachVisit>
  );
}
