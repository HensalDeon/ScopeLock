import { Plus } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClientList } from "@/modules/clients";
import {
  countArchivedClients,
  listClientsPage,
} from "@/modules/clients/server";
import { countProjectsByClient } from "@/modules/projects/server";
import { parsePage } from "@/shared/lib/pagination";
import { listHref, parseSearch } from "@/shared/lib/search";
import { Button } from "@/shared/ui/button";
import { EmptyState, ListSkeleton } from "@/shared/ui/list-states";
import { PageContainer, PageHeader } from "@/shared/ui/page";
import { Pagination } from "@/shared/ui/pagination";
import { SearchBox } from "@/shared/ui/search-box";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage({ searchParams }: PageProps<"/clients">) {
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
        <Clients searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function Clients({
  searchParams,
}: {
  searchParams: PageProps<"/clients">["searchParams"];
}) {
  const query = await searchParams;
  const archived = query.view === "archived";
  const search = parseSearch(query.q);
  const [page, archivedCount, projectCounts] = await Promise.all([
    listClientsPage({ archived, page: parsePage(query.page), search }),
    archived ? Promise.resolve(0) : countArchivedClients(),
    countProjectsByClient(),
  ]);
  const view = archived ? "archived" : null;
  const href = (n: number) =>
    listHref("/clients", { view, q: search, page: n }) as Route;
  const searchBox = (search || page.total > 0) && (
    <SearchBox
      action="/clients"
      value={search}
      label={archived ? "Search archived clients" : "Search clients"}
      placeholder="Name, company, email or phone"
      hidden={archived ? { view: "archived" } : {}}
    />
  );
  const noMatch = search && page.total === 0 && (
    <EmptyState title={`No clients match “${search}”`}>
      Try part of their name, company, email or phone number.
    </EmptyState>
  );

  if (archived) {
    return (
      <div className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold">Archived clients</h2>
          <Link
            href="/clients"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Back to active clients
          </Link>
        </div>
        {searchBox}
        {page.total > 0 ? (
          <ClientList clients={page.items} projectCounts={projectCounts} />
        ) : (
          noMatch || (
            <EmptyState title="No archived clients">
              Clients you archive are kept here with their history, and can be
              restored from their page.
            </EmptyState>
          )
        )}
        <Pagination page={page} noun="archived clients" href={href} />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {searchBox}
      {page.total > 0 ? (
        <ClientList clients={page.items} projectCounts={projectCounts} />
      ) : (
        noMatch || (
          <EmptyState
            title="No clients yet"
            action={
              // The header's Add client is the one filled button.
              <Button asChild variant="outline">
                <Link href="/clients/new">Add your first client</Link>
              </Button>
            }
          >
            Add the person who approves your work, like Rahul Mehta from Mehta
            Interiors. Their projects, change requests and payments will appear
            under their name.
          </EmptyState>
        )
      )}
      <Pagination page={page} noun="clients" href={href} />
      {archivedCount > 0 && (
        <Link
          href="/clients?view=archived"
          className="justify-self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
        >
          Archived clients ({archivedCount})
        </Link>
      )}
    </div>
  );
}
