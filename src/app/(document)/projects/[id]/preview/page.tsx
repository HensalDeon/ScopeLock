import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { clientFirstName } from "@/modules/clients";
import { ClassicDocument } from "@/modules/documents";
import { isEditable } from "@/modules/projects";
import { getProposalDocument } from "@/modules/projects/server";
import { Button } from "@/shared/ui/button";
import { cssString } from "@/shared/lib/css-string";
import { PrintButton } from "@/shared/ui/print-button";

export const metadata: Metadata = { title: "Proposal preview" };

export default function ProposalPreviewPage({
  params,
}: PageProps<"/projects/[id]/preview">) {
  return (
    <Suspense fallback={<PreviewSkeleton />}>
      <Preview params={params} />
    </Suspense>
  );
}

async function Preview({
  params,
}: {
  params: PageProps<"/projects/[id]/preview">["params"];
}) {
  const { id } = await params;
  const { project, data, style, images } = await getProposalDocument(id);
  const footer = `${data.business.name}  ·  Proposal ${data.reference}`;

  return (
    <>
      {/* Printed pages: A4, full-bleed cover, footer with page numbers. */}
      <style>{`
        @page { size: A4; margin: 12mm 0 14mm;
          @bottom-left { content: ${cssString(footer)}; font: 8pt system-ui, sans-serif; color: #8a8f98; padding-left: 14mm; }
          @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 8pt system-ui, sans-serif; color: #8a8f98; padding-right: 14mm; }
        }
        @page :first { margin-top: 0; }
      `}</style>

      <div className="sticky top-0 z-10 border-b border-black/10 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Back to project"
            >
              <Link href={`/projects/${project.id}`}>
                <ArrowLeft aria-hidden />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Preview as client</p>
              <p className="truncate text-xs text-muted-foreground">
                {project.status === "draft"
                  ? `Draft. This is what ${project.client ? clientFirstName(project.client) : "your client"} will see.`
                  : "What your client sees."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/settings/documents">Document style</Link>
            </Button>
            {isEditable(project.status) && (
              <Button asChild variant="outline">
                <Link href={`/projects/${project.id}/edit`}>Edit</Link>
              </Button>
            )}
            <PrintButton />
          </div>
        </div>
      </div>

      <main className="px-0 py-0 sm:px-4 sm:py-8 print:p-0">
        <ClassicDocument
          data={data}
          style={style}
          images={images}
          className="mx-auto max-w-[210mm] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] sm:rounded-sm print:max-w-none print:shadow-none"
        />
      </main>
    </>
  );
}

function PreviewSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-[210mm] px-4 py-16">
      <div className="h-72 rounded-sm bg-[#1d1f24]/80" />
      <div className="mt-4 h-96 rounded-sm bg-white" />
    </div>
  );
}
