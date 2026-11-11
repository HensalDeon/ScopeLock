import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/modules/admin/server";
import {
  planById,
  PlanForm,
  planFormValues,
  PriceHistory,
} from "@/modules/billing";
import { findPriceHistory, getPlans } from "@/modules/billing/server";
import { BackLink } from "@/shared/ui/back-link";
import { PageContainer, PageHeader, Section } from "@/shared/ui/page";

export default function EditPlanPage({
  params,
}: PageProps<"/admin/plans/[id]">) {
  return (
    <PageContainer>
      <Suspense fallback={<div className="h-160 rounded-xl bg-background" />}>
        <EditPlan params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function EditPlan({
  params,
}: {
  params: PageProps<"/admin/plans/[id]">["params"];
}) {
  await requireAdmin();
  const plan = planById(await getPlans(), (await params).id);
  if (!plan) notFound();
  const history = await findPriceHistory(plan.id);
  return (
    <>
      <title>{`Edit ${plan.name} · ScopeLock admin`}</title>
      <BackLink href="/admin/plans" className="mb-4">
        Plans
      </BackLink>
      <PageHeader
        title={`Edit ${plan.name}`}
        description="Saved changes show on the landing and pricing pages straight away, and apply at once to every workspace on this plan."
      />
      <PlanForm defaults={planFormValues(plan)} />
      <div className="mt-12 border-t pt-8">
        <Section
          title="Price history"
          description="Prices are never edited, only added, so this is what the plan cost and when."
        >
          <PriceHistory entries={history} />
        </Section>
      </div>
    </>
  );
}
