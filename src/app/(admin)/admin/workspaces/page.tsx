import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { WorkspaceList } from "@/modules/admin";
import { requireAdmin } from "@/modules/admin/server";
import { planById } from "@/modules/billing";
import {
  findGivenWorkspaceIds,
  findSubscriptions,
  getPlans,
} from "@/modules/billing/server";
import { listWorkspaceDirectory } from "@/shared/auth/directory";
import { parsePage } from "@/shared/lib/pagination";
import { listHref, parseSearch } from "@/shared/lib/search";
import { cn } from "@/shared/lib/utils";
import { EmptyState, ListSkeleton } from "@/shared/ui/list-states";
import { PageContainer, PageHeader } from "@/shared/ui/page";
import { Pagination } from "@/shared/ui/pagination";
import { SearchBox } from "@/shared/ui/search-box";

export default function AdminWorkspacesPage({
  searchParams,
}: PageProps<"/admin/workspaces">) {
  return (
    <PageContainer>
      <Suspense fallback={<ListSkeleton rows={5} search />}>
        <Workspaces searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function Workspaces({
  searchParams,
}: {
  searchParams: PageProps<"/admin/workspaces">["searchParams"];
}) {
  await requireAdmin();
  const query = await searchParams;
  const search = parseSearch(query.q);
  const given = query.view === "given";
  const page = await listWorkspaceDirectory(
    parsePage(query.page),
    search,
    given ? await findGivenWorkspaceIds() : undefined,
  );
  const view = given ? "given" : null;
  const tab = (label: string, v: string | null) => (
    <Link
      href={listHref("/admin/workspaces", { view: v, q: search }) as Route}
      aria-current={view === v ? "page" : undefined}
      className={cn(
        "inline-flex h-8 items-center rounded-md px-2.5 text-sm max-sm:h-11",
        view === v
          ? "bg-muted font-medium"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
  const [plans, subs] = await Promise.all([
    getPlans(),
    findSubscriptions(page.items.map((w) => w.workspaceId)),
  ]);
  const rows = page.items.map((w) => {
    const sub = subs.get(w.workspaceId);
    return {
      ...w,
      plan: planById(plans, sub?.planId ?? "free")?.name ?? "Free",
      given: sub?.source === "admin",
    };
  });
  return (
    <>
      <title>Workspaces · ScopeLock admin</title>
      <PageHeader
        title="Workspaces"
        description="Every business using ScopeLock, newest first. Open one to put it on a plan by hand."
      />
      <div className="grid gap-4">
        <nav aria-label="Show" className="flex gap-1">
          {tab("All", null)}
          {tab("Given plans", "given")}
        </nav>
        <SearchBox
          action="/admin/workspaces"
          value={search}
          label="Search by business name, or owner's email (with @)"
          placeholder="Business name or owner's email"
          hidden={given ? { view: "given" } : {}}
        />
        {page.total === 0 ? (
          <EmptyState
            title={
              search
                ? `No workspaces match “${search}”`
                : given
                  ? "No workspaces on a given plan"
                  : "No workspaces yet"
            }
          >
            {search
              ? "Try part of the business name, or type the owner's email (anything with @ searches emails)."
              : given
                ? "Workspaces you put on Pro or Agency by hand show here, so you can review them later."
                : "Each business that signs up and finishes onboarding shows here."}
          </EmptyState>
        ) : (
          <>
            <WorkspaceList rows={rows} />
            <Pagination
              page={page}
              noun="workspaces"
              href={(n) =>
                listHref("/admin/workspaces", {
                  view,
                  q: search,
                  page: n,
                }) as Route
              }
            />
          </>
        )}
      </div>
    </>
  );
}
