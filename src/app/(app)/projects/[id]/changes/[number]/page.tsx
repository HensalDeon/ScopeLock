import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { clientFirstName } from "@/modules/clients";
import {
  ChangeActions,
  ChangeStatusBadge,
  changeLabel,
  SOURCE_LABELS,
} from "@/modules/changes";
import { changeOrderData, getChangeOrNotFound } from "@/modules/changes/server";
import { ChangeOrderDocument } from "@/modules/documents";
import {
  getDocumentImages,
  getDocumentSettings,
} from "@/modules/documents/server";
import { getProjectOrNotFound, getShareState } from "@/modules/projects/server";
import { requireWorkspace } from "@/modules/workspace/server";
import { formatDateTime } from "@/shared/lib/dates";
import { formatMoney } from "@/shared/lib/money";
import { BackLink } from "@/shared/ui/back-link";
import { PageContainer } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Change request" };

export default function ChangePage({
  params,
}: PageProps<"/projects/[id]/changes/[number]">) {
  return (
    <PageContainer>
      <Suspense fallback={<ChangeSkeleton />}>
        <ChangeDetail params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function ChangeDetail({
  params,
}: Pick<PageProps<"/projects/[id]/changes/[number]">, "params">) {
  const { id, number } = await params;
  const [project, { change, sent }, share, context, settings] =
    await Promise.all([
      getProjectOrNotFound(id),
      getChangeOrNotFound(id, number),
      getShareState(id),
      requireWorkspace(),
      getDocumentSettings(),
    ]);
  const images = await getDocumentImages(settings);
  const label = changeLabel(change.number);
  // Sent or answered: exactly what the client saw. Draft: as it would go now.
  const data =
    change.status !== "draft" && sent
      ? sent
      : changeOrderData(project, change, context);
  const total = formatMoney(change.total, change.currency);
  const firstName = project.client
    ? clientFirstName(project.client)
    : "your client";
  const base = `/projects/${project.id}`;

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <BackLink href={base as Route}>Back to project</BackLink>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid min-w-0 gap-1.5">
            <p className="font-mono text-[11.5px] tracking-[0.14em] text-muted-foreground uppercase">
              {label} · {project.name}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
                {change.title}
              </h1>
              <ChangeStatusBadge status={change.status} />
            </div>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{total}</p>
        </div>
        {change.source && (
          <p className="text-sm text-muted-foreground">
            Asked on {SOURCE_LABELS[change.source.channel]}
            {change.source.note ? `: ${change.source.note}` : ""}
            <span className="sr-only"> (only you see this)</span>
          </p>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">
            {change.status === "draft"
              ? `What ${firstName} will see`
              : `What ${firstName} saw (sent ${change.sentAt ? formatDateTime(change.sentAt) : ""})`}
          </p>
          <ChangeOrderDocument
            data={data}
            style={settings.style}
            images={images}
            className="rounded-lg border"
          />
        </div>
        <aside className="grid gap-4 lg:sticky lg:top-6">
          <ChangeActions
            change={change}
            projectId={project.id}
            editHref={`${base}/changes/${change.number}/edit` as Route}
            emailVerified={context.user.emailVerified}
            clientFirstName={firstName}
            link={
              share.url
                ? {
                    url: `${share.url}/changes/${change.number}`,
                    phone: project.client?.phone ?? null,
                    message: `Hi ${firstName}, here's a change request for ${project.name}: ${change.title} (${total}). You can approve or decline it here:`,
                  }
                : null
            }
          />
          {change.decision && (
            <Link
              href={`${base}/answers/${change.decision.approvalId}` as Route}
              className="px-1 text-sm font-medium underline-offset-4 hover:underline"
            >
              View the signed record
            </Link>
          )}
          {(change.status === "rejected" || change.status === "withdrawn") && (
            <Link
              href={`${base}/changes/new?from=${change.number}` as Route}
              className="px-1 text-sm font-medium underline-offset-4 hover:underline"
            >
              Send a revised change request
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

function ChangeSkeleton() {
  return (
    <div aria-hidden className="grid gap-6">
      <div className="grid gap-3">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-7 w-72 rounded bg-muted" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="h-96 rounded-lg border bg-background" />
        <div className="h-48 rounded-xl border bg-canvas" />
      </div>
    </div>
  );
}
