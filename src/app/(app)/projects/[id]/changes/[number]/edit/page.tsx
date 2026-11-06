import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ChangeForm, changeLabel } from "@/modules/changes";
import { getChangeOrNotFound } from "@/modules/changes/server";
import { getProjectOrNotFound } from "@/modules/projects/server";
import { toMajor } from "@/shared/lib/money";
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
  const [project, { change }] = await Promise.all([
    getProjectOrNotFound(id),
    getChangeOrNotFound(id, number),
  ]);
  const page = `/projects/${project.id}/changes/${change.number}` as Route;
  if (change.status !== "draft") redirect(page);

  return (
    <div className="grid gap-2">
      <BackLink href={page} className="mb-1">
        Back to {changeLabel(change.number)}
      </BackLink>
      <PageHeader title={`Edit ${changeLabel(change.number)}`} />
      <ChangeForm
        mode="edit"
        projectId={project.id}
        number={change.number}
        currency={project.currency}
        milestones={project.milestones.map((m) => ({ id: m.id, name: m.name }))}
        defaults={{
          title: change.title,
          description: change.description ?? "",
          items: change.items.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description ?? "",
            amount: String(toMajor(item.amount)),
          })),
          billingOption: change.billing.option,
          milestoneId: change.billing.milestoneId ?? "",
          sourceChannel: change.source?.channel ?? "",
          sourceNote: change.source?.note ?? "",
        }}
        cancelHref={page}
      />
    </div>
  );
}
