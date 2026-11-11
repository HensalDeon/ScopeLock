import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  billingContext,
  blankChangeValues,
  ChangeForm,
  changeLabel,
  changeValuesFrom,
  changeValuesFromAddon,
} from "@/modules/changes";
import { listChanges } from "@/modules/changes/server";
import { getGstRule } from "@/modules/invoices/server";
import { getProjectPayments } from "@/modules/payments/server";
import { getProjectOrNotFound } from "@/modules/projects/server";
import { BackLink } from "@/shared/ui/back-link";
import { Button } from "@/shared/ui/button";
import { FreshOnEachVisit } from "@/shared/ui/fresh-on-each-visit";
import { PageContainer, PageHeader } from "@/shared/ui/page";

export const metadata: Metadata = { title: "New change request" };

export default function NewChangePage({
  params,
  searchParams,
}: PageProps<"/projects/[id]/changes/new">) {
  return (
    <PageContainer>
      <Suspense fallback={<div className="h-[40rem] rounded-xl bg-canvas" />}>
        <NewChange params={params} searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function NewChange({
  params,
  searchParams,
}: Pick<PageProps<"/projects/[id]/changes/new">, "params" | "searchParams">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [project, gstFor] = await Promise.all([
    getProjectOrNotFound(id),
    getGstRule(),
  ]);
  const back = `/projects/${project.id}` as Route;

  // Archived projects are read-only: back to the project (Restore is there).
  if (project.archivedAt) redirect(back);
  if (project.status !== "active") {
    return (
      <div className="grid gap-4">
        <BackLink href={back}>Back to project</BackLink>
        <PageHeader
          title="Not yet"
          description="Change requests start once your client has approved the proposal. Send it from the project page first."
        />
        <Button asChild className="justify-self-start">
          <Link href={back}>Back to project</Link>
        </Button>
      </div>
    );
  }

  const changes = await listChanges(project.id);
  const { payments } = await getProjectPayments(project, changes);
  // "Turn into a change request" (?addon=) or "Send a revised one" (?from=).
  const addon = project.proposal.addons.find((a) => a.id === query.addon);
  const from =
    typeof query.from === "string"
      ? changes.find((c) => String(c.number) === query.from)
      : undefined;
  const defaults = from
    ? changeValuesFrom(from, { revise: true })
    : addon
      ? changeValuesFromAddon(addon, project.billingModel)
      : blankChangeValues(project.billingModel);

  return (
    <div className="grid gap-2">
      <BackLink href={back} className="mb-1">
        Back to project
      </BackLink>
      <PageHeader
        title={
          from
            ? `Revise ${changeLabel(from.number)} ${from.title}`
            : "New change request"
        }
        description={
          from?.decision?.decision === "rejected"
            ? `${from.decision.name} declined it${
                from.decision.comment ? `: “${from.decision.comment}”` : "."
              } Change what they asked about and send it again as a new request.`
            : `Extra work on ${project.name}, with its own price. ${
                project.client?.name ?? "Your client"
              } approves it on the same link as the proposal.`
        }
      />
      <FreshOnEachVisit>
        <ChangeForm
          mode="create"
          projectId={project.id}
          currency={project.currency}
          milestones={project.milestones.map((m) => ({
            id: m.id,
            name: m.name,
          }))}
          defaults={defaults}
          cancelHref={back}
          gstPercent={gstFor(project.client)}
          billing={billingContext(project.milestones, changes, payments)}
        />
      </FreshOnEachVisit>
    </div>
  );
}
