import type { Metadata } from "next";
import { Suspense } from "react";
import { clientLabel } from "@/modules/clients";
import { listClients } from "@/modules/clients/server";
import { getDocumentSettings } from "@/modules/documents/server";
import {
  EMPTY_PROPOSAL,
  indiaDatePlusDays,
  ProjectForm,
  proposalFormDefaults,
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
        clients={clients.map((c) => ({
          id: c.id,
          label: clientLabel(c),
          currency: c.currency,
        }))}
        defaultCurrency={workspace.currency}
        cancelHref="/projects"
        defaults={{
          clientId: preselected,
          // The chosen client's currency, else the workspace default.
          currency:
            clients.find((c) => c.id === preselected)?.currency ??
            workspace.currency,
          name: "",
          description: "",
          items: [],
          billingModel: "milestones",
          milestones: [],
          // Start from the workspace's standard text (Settings → Documents).
          proposal: proposalFormDefaults({
            ...EMPTY_PROPOSAL,
            ...settings.defaults,
            validUntil: indiaDatePlusDays(14),
          }),
        }}
      />
    </FreshOnEachVisit>
  );
}
