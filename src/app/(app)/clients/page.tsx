import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClientList } from "@/modules/clients";
import { listClients } from "@/modules/clients/server";
import { listProjects } from "@/modules/projects/server";
import { Button } from "@/shared/ui/button";
import { EmptyState, ListSkeleton } from "@/shared/ui/list-states";
import { PageContainer, PageHeader } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        description="The people who approve your scope and change requests."
        actions={
          <Button asChild>
            <Link href="/clients/new">
              <Plus aria-hidden />
              Add client
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<ListSkeleton rows={4} />}>
        <Clients />
      </Suspense>
    </PageContainer>
  );
}

async function Clients() {
  const [active, archived, projects] = await Promise.all([
    listClients(),
    listClients({ archived: true }),
    listProjects(),
  ]);
  const projectCounts = new Map<string, number>();
  for (const p of projects) {
    projectCounts.set(p.clientId, (projectCounts.get(p.clientId) ?? 0) + 1);
  }

  return (
    <div className="grid gap-8">
      {active.length > 0 ? (
        <ClientList clients={active} projectCounts={projectCounts} />
      ) : (
        <EmptyState
          title="No clients yet"
          action={
            <Button asChild>
              <Link href="/clients/new">Add your first client</Link>
            </Button>
          }
        >
          Add the person who approves your work, like Rahul Mehta from Mehta
          Interiors. Their projects, change requests and payments will appear
          under their name.
        </EmptyState>
      )}

      {archived.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Archived clients ({archived.length})
          </summary>
          <div className="mt-3">
            <ClientList clients={archived} projectCounts={projectCounts} />
          </div>
        </details>
      )}
    </div>
  );
}
