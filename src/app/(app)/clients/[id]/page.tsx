import { Plus } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArchiveClientButton,
  ClientForm,
  clientContactLine,
  clientFormValues,
} from "@/modules/clients";
import { getClientOrNotFound } from "@/modules/clients/server";
import { ProjectList } from "@/modules/projects";
import { listProjectsForClient } from "@/modules/projects/server";
import { requireWorkspace } from "@/modules/workspace/server";
import { formatDate } from "@/shared/lib/dates";
import { parsePage } from "@/shared/lib/pagination";
import { whatsappLink } from "@/shared/lib/phone";
import { BackLink } from "@/shared/ui/back-link";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/list-states";
import { PageContainer, Section } from "@/shared/ui/page";
import { Pagination } from "@/shared/ui/pagination";

export const metadata: Metadata = { title: "Client" };

export default function ClientPage({
  params,
  searchParams,
}: PageProps<"/clients/[id]">) {
  return (
    <PageContainer>
      <Suspense fallback={<div className="h-96 rounded-xl bg-canvas" />}>
        <ClientDetail params={params} searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function ClientDetail({
  params,
  searchParams,
}: Pick<PageProps<"/clients/[id]">, "params" | "searchParams">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [client, projects, { workspace }] = await Promise.all([
    getClientOrNotFound(id),
    listProjectsForClient(id, parsePage(query.page)),
    requireWorkspace(),
  ]);
  const archived = client.archivedAt !== null;

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <BackLink href="/clients">Clients</BackLink>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid min-w-0 gap-1">
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">
              {client.name}
            </h1>
            <p className="text-[15px] text-muted-foreground">
              {clientContactLine(client)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {client.phone && (
              <Button asChild variant="outline">
                <a
                  href={whatsappLink(client.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open WhatsApp
                </a>
              </Button>
            )}
            {!archived && (
              <Button asChild>
                <Link href={`/projects/new?client=${client.id}`}>
                  <Plus aria-hidden />
                  New project
                </Link>
              </Button>
            )}
          </div>
        </div>
        {archived && client.archivedAt && (
          <p className="w-fit rounded-md border bg-canvas px-3 py-1.5 text-sm text-muted-foreground">
            Archived on {formatDate(client.archivedAt)}. Hidden from your client
            list and the project picker.
          </p>
        )}
      </div>

      <section aria-labelledby={`projects-${client.id}`} className="grid gap-3">
        <h2 id={`projects-${client.id}`} className="text-[15px] font-semibold">
          Projects
        </h2>
        {projects.total > 0 ? (
          <>
            <ProjectList projects={projects.items} showClient={false} />
            <Pagination
              page={projects}
              noun="projects"
              href={(n) =>
                (n === 1
                  ? `/clients/${client.id}`
                  : `/clients/${client.id}?page=${n}`) as Route
              }
            />
          </>
        ) : (
          <EmptyState title={`No projects for ${client.name} yet`}>
            Projects you create for {client.name} will appear here, with their
            scope, status and totals.
          </EmptyState>
        )}
      </section>

      <div>
        <Section
          title="Contact details"
          description="Used to send approval links and receipts."
        >
          <ClientForm
            mode="edit"
            clientId={client.id}
            defaultCurrency={workspace.currency}
            defaults={clientFormValues(client)}
          />
        </Section>
        <Section
          title={archived ? "Restore" : "Archive"}
          description={
            archived
              ? "Show this client in your list and the project picker again."
              : "Hide this client without losing their history."
          }
        >
          <ArchiveClientButton
            clientId={client.id}
            archived={archived}
            clientName={client.name}
          />
        </Section>
      </div>
    </div>
  );
}
