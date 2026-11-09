import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { clientFirstName } from "@/modules/clients";
import {
  ChangeActions,
  ChangeStatusBadge,
  changeLabel,
  changeShareMessage,
  SOURCE_LABELS,
} from "@/modules/changes";
import {
  draftChangeOrder,
  getChangeOrNotFound,
} from "@/modules/changes/server";
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
import { PrintSetup } from "@/shared/ui/print-setup";
import { documentTitle } from "@/shared/lib/document-title";

// Also the saved PDF's file name: "CR-002 Gallery page · Website redesign".
export async function generateMetadata({
  params,
}: PageProps<"/projects/[id]/changes/[number]">): Promise<Metadata> {
  const { id, number } = await params;
  const [project, { change }] = await Promise.all([
    getProjectOrNotFound(id),
    getChangeOrNotFound(id, number),
  ]);
  return {
    title: {
      absolute: documentTitle(
        `${changeLabel(change.number)} ${change.title}`,
        project.name,
      ),
    },
  };
}

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
      : await draftChangeOrder(project, change, context);
  const total = formatMoney(change.total, change.currency);
  const firstName = project.client
    ? clientFirstName(project.client)
    : "your client";
  const base = `/projects/${project.id}`;

  return (
    <div className="grid gap-6">
      {/* Printing gives just the change order, like the client's copy. */}
      {data && (
        <PrintSetup
          cover
          footer={`${data.business.name} · ${data.reference} · Proposal ${data.projectReference}`}
        />
      )}
      <div className="grid gap-3 print:hidden">
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
          <p className="text-sm text-muted-foreground print:hidden">
            {change.status === "draft"
              ? `What ${firstName} will see`
              : `What ${firstName} saw (sent ${change.sentAt ? formatDateTime(change.sentAt) : ""})`}
          </p>
          <ChangeOrderDocument
            data={data}
            approved={change.status === "approved"}
            titleAs="h2"
            style={settings.style}
            images={images}
            className="rounded-lg border print:rounded-none print:border-0"
          />
        </div>
        <aside className="grid gap-4 max-lg:order-first lg:sticky lg:top-6 print:hidden">
          <ChangeActions
            change={change}
            projectId={project.id}
            editHref={`${base}/changes/${change.number}/edit` as Route}
            reviseHref={
              change.status === "rejected" || change.status === "withdrawn"
                ? (`${base}/changes/new?from=${change.number}` as Route)
                : null
            }
            emailVerified={context.user.emailVerified}
            clientFirstName={firstName}
            link={
              share.url
                ? {
                    url: `${share.url}/changes/${change.number}`,
                    phone: project.client?.phone ?? null,
                    message: changeShareMessage({
                      clientFirstName: firstName,
                      projectName: project.name,
                      title: change.title,
                      total,
                      status: change.status,
                    }),
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
