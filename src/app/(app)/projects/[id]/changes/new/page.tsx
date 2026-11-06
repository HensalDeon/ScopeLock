import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChangeForm, type ChangeFormValues } from "@/modules/changes";
import { listChanges } from "@/modules/changes/server";
import { getProjectOrNotFound } from "@/modules/projects/server";
import { toMajor, type Minor } from "@/shared/lib/money";
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

  const amount = (value: Minor) => String(toMajor(value));
  let defaults: ChangeFormValues = {
    title: "",
    description: "",
    items: [],
    billingOption: project.billingModel === "upfront" ? "pay_now" : "final",
    milestoneId: "",
    sourceChannel: "",
    sourceNote: "",
  };

  // "Turn into a change request" from a proposal add-on.
  const addon = project.proposal.addons.find((a) => a.id === query.addon);
  if (addon) {
    defaults = {
      ...defaults,
      title: addon.title,
      description: addon.description ?? "",
      items: [
        {
          title: addon.unit
            ? `${addon.title} (${addon.unit.replace(/^\/\s*/, "per ")})`
            : addon.title,
          description: "",
          amount: amount(addon.amount),
        },
      ],
    };
  }

  // "Send a revised one" from a declined or cancelled change request.
  const from =
    typeof query.from === "string"
      ? (await listChanges(project.id)).find(
          (c) => String(c.number) === query.from,
        )
      : undefined;
  if (from) {
    defaults = {
      ...defaults,
      title: from.title,
      description: from.description ?? "",
      items: from.items.map((item) => ({
        title: item.title,
        description: item.description ?? "",
        amount: amount(item.amount),
      })),
      billingOption: from.billing.option,
      milestoneId: from.billing.milestoneId ?? "",
      sourceChannel: from.source?.channel ?? "",
      sourceNote: from.source?.note ?? "",
    };
  }

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
