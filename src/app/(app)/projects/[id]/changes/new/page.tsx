import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  blankChangeValues,
  ChangeForm,
  changeValuesFrom,
  changeValuesFromAddon,
} from "@/modules/changes";
import { listChanges } from "@/modules/changes/server";
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
  const project = await getProjectOrNotFound(id);
  const back = `/projects/${project.id}` as Route;

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

  // "Turn into a change request" (?addon=) or "Send a revised one" (?from=).
  const addon = project.proposal.addons.find((a) => a.id === query.addon);
  const from =
    typeof query.from === "string"
      ? (await listChanges(project.id)).find(
          (c) => String(c.number) === query.from,
        )
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
        title="New change request"
        description={`Extra work on ${project.name}, with its own price. ${
          project.client?.name ?? "Your client"
        } approves it on the same link as the proposal.`}
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
        />
      </FreshOnEachVisit>
    </div>
  );
}
