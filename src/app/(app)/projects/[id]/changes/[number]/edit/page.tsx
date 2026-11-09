import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  billingContext,
  ChangeForm,
  changeLabel,
  changeValuesFrom,
} from "@/modules/changes";
import { getChangeOrNotFound, listChanges } from "@/modules/changes/server";
import { getGstRule } from "@/modules/invoices/server";
import { getProjectPayments } from "@/modules/payments/server";
import { getProjectOrNotFound } from "@/modules/projects/server";
import { BackLink } from "@/shared/ui/back-link";
import { PageContainer, PageHeader } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Edit change request" };

export default function EditChangePage({
  params,
}: PageProps<"/projects/[id]/changes/[number]/edit">) {
  return (
    <PageContainer>
      <Suspense fallback={<div className="h-[40rem] rounded-xl bg-canvas" />}>
        <EditChange params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function EditChange({
  params,
}: Pick<PageProps<"/projects/[id]/changes/[number]/edit">, "params">) {
  const { id, number } = await params;
  const [project, { change }, gstFor, changes] = await Promise.all([
    getProjectOrNotFound(id),
    getChangeOrNotFound(id, number),
    getGstRule(),
    listChanges(id),
  ]);
  const page = `/projects/${project.id}/changes/${change.number}` as Route;
  if (change.status !== "draft") redirect(page);
  const { payments } = await getProjectPayments(project, changes);

  return (
    <div className="grid gap-2">
      <BackLink href={page} className="mb-1">
        Back to {changeLabel(change.number)}
      </BackLink>
      <PageHeader title={`Edit ${changeLabel(change.number)}`} />
      <ChangeForm
        gstPercent={gstFor(project.client)}
        billing={billingContext(project.milestones, changes, payments)}
        mode="edit"
        projectId={project.id}
        number={change.number}
        currency={project.currency}
        milestones={project.milestones.map((m) => ({ id: m.id, name: m.name }))}
        defaults={changeValuesFrom(change)}
        cancelHref={page}
      />
    </div>
  );
}
