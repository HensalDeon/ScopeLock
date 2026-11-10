import type { Route } from "next";
import { Suspense } from "react";
import { ChangeLog } from "@/modules/admin";
import { listAdminChanges, requireAdmin } from "@/modules/admin/server";
import { PlansLedger } from "@/modules/billing";
import { getPlans } from "@/modules/billing/server";
import { parsePage } from "@/shared/lib/pagination";
import { EmptyState, ListSkeleton } from "@/shared/ui/list-states";
import { PageContainer, PageHeader } from "@/shared/ui/page";
import { Pagination } from "@/shared/ui/pagination";

export default function AdminPlansPage({
  searchParams,
}: PageProps<"/admin/plans">) {
  return (
    <PageContainer>
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <AdminPlans searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

/** Nothing renders, not even into the prerendered shell, before the check. */
async function AdminPlans({
  searchParams,
}: {
  searchParams: PageProps<"/admin/plans">["searchParams"];
}) {
  await requireAdmin();
  const [plans, changes] = await Promise.all([
    getPlans(),
    listAdminChanges(parsePage((await searchParams).page)),
  ]);
  return (
    <>
      <title>Plans · ScopeLock admin</title>
      <PageHeader
        title="Plans"
        description="Prices, limits and features for Free, Pro and Agency. The landing and pricing pages show a saved change straight away."
      />
      <PlansLedger plans={plans} />
      <section aria-labelledby="changes-title" className="mt-12 grid gap-3">
        <h2 id="changes-title" className="text-[15px] font-semibold">
          Changes
        </h2>
        {changes.total === 0 ? (
          <EmptyState title="No changes yet">
            Every saved change to a plan shows here with who made it and when,
            like “Price ₹499 → ₹599 a month”. The log can&apos;t be edited.
          </EmptyState>
        ) : (
          <div className="grid gap-4">
            <ChangeLog entries={changes.items} />
            <Pagination
              page={changes}
              noun="changes"
              href={(n) => `/admin/plans?page=${n}` as Route}
            />
          </div>
        )}
      </section>
    </>
  );
}
