import { ArrowLeft } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { verdictLabel } from "@/modules/approvals";
import { getApprovalWithSnapshot } from "@/modules/approvals/server";
import { getProposalDocument } from "@/modules/projects/server";
import {
  ChangeOrderDocument,
  ClassicDocument,
  type ChangeOrderData,
  type ProposalDocumentData,
} from "@/modules/documents";
import {
  getDocumentImages,
  getDocumentSettings,
} from "@/modules/documents/server";
import { formatDateTime } from "@/shared/lib/dates";
import { Button } from "@/shared/ui/button";
import { PrintButton } from "@/shared/ui/print-button";
import { PrintSetup } from "@/shared/ui/print-setup";
import { documentTitle } from "@/shared/lib/document-title";

// Also the saved PDF's file name: "CR-002 declined by Rahul Mehta · …".
export async function generateMetadata({
  params,
}: PageProps<"/projects/[id]/answers/[approvalId]">): Promise<Metadata> {
  const { id, approvalId } = await params;
  const record = await getApprovalWithSnapshot(id, approvalId);
  return {
    title: record
      ? {
          absolute: documentTitle(
            `${record.approval.label} ${verdictLabel(record.approval).toLowerCase()} by ${record.approval.decidedBy.name}`,
            recordTitle(record.snapshot),
            "Signed record",
          ),
        }
      : "Signed record",
  };
}

export default function AnswerPage({
  params,
}: PageProps<"/projects/[id]/answers/[approvalId]">) {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden
          className="mx-auto h-[80vh] max-w-[210mm] bg-white/70"
        />
      }
    >
      <Answer params={params} />
    </Suspense>
  );
}

async function Answer({
  params,
}: Pick<PageProps<"/projects/[id]/answers/[approvalId]">, "params">) {
  const { id, approvalId } = await params;
  const [record, settings, { gstNote }] = await Promise.all([
    getApprovalWithSnapshot(id, approvalId),
    getDocumentSettings(),
    getProposalDocument(id),
  ]);
  if (!record) notFound();
  const { approval, snapshot, acceptance } = record;
  const images = await getDocumentImages(settings);
  const verdict = verdictLabel(approval);

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-black/10 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Back to project"
            >
              <Link href={`/projects/${id}` as Route}>
                <ArrowLeft aria-hidden />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {approval.label}: {verdict.toLowerCase()} by{" "}
                {approval.decidedBy.name}
              </p>
              <p className="truncate text-xs text-muted-foreground tabular-nums">
                {formatDateTime(approval.decidedAt)} ·{" "}
                {approval.intact
                  ? "Record intact"
                  : "Record doesn't match its signature"}
              </p>
            </div>
          </div>
          <PrintButton />
        </div>
      </div>
      <div className="mx-auto max-w-[210mm] px-4 pt-4 text-xs text-muted-foreground print:hidden">
        This is the exact content {approval.decidedBy.name} saw, from the signed
        record. It shows in your current document style.
      </div>
      <PrintSetup
        cover
        footer={`${approval.label}: ${verdict.toLowerCase()} by ${approval.decidedBy.name} · ${formatDateTime(approval.decidedAt)}`}
      />
      <main className="px-0 py-0 sm:px-4 sm:py-4 print:p-0">
        {approval.subject.type === "baseline" ? (
          <>
            <ClassicDocument
              data={snapshot as ProposalDocumentData}
              acceptance={acceptance}
              style={settings.style}
              images={images}
              className="mx-auto max-w-[210mm] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] sm:rounded-[2px] print:max-w-none print:shadow-none"
            />
            {gstNote && (
              <p className="mx-auto mt-4 max-w-[210mm] rounded-md bg-white/80 px-4 py-3 text-sm text-pretty text-[#3a3d44] print:hidden">
                <span className="font-medium">
                  Added after {approval.decidedBy.name} answered, not part of
                  the signed record:
                </span>{" "}
                {gstNote}
              </p>
            )}
          </>
        ) : (
          <ChangeOrderDocument
            data={snapshot as ChangeOrderData}
            acceptance={acceptance}
            approved={approval.decision === "approved"}
            style={settings.style}
            images={images}
            className="mx-auto max-w-[210mm] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] sm:rounded-[2px] print:max-w-none print:shadow-none"
          />
        )}
      </main>
    </>
  );
}

/** The project and business a signed record is about, for its file name. */
function recordTitle(snapshot: unknown): string | null {
  const s = snapshot as {
    title?: string;
    projectTitle?: string;
    business?: { name?: string };
  };
  return (
    [s.projectTitle ?? s.title, s.business?.name].filter(Boolean).join(" · ") ||
    null
  );
}
