import { ArrowLeft } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getDocumentSettings } from "@/modules/documents/server";
import { StatementDocument } from "@/modules/statement";
import { getStatement } from "@/modules/statement/server";
import { documentTitle } from "@/shared/lib/document-title";
import { Button } from "@/shared/ui/button";
import { PrintButton } from "@/shared/ui/print-button";
import { PrintSetup } from "@/shared/ui/print-setup";

// Also the saved PDF's file name: "Project statement P-007 · Website redesign".
export async function generateMetadata({
  params,
}: PageProps<"/projects/[id]/statement">): Promise<Metadata> {
  const s = await getStatement((await params).id);
  return {
    title: {
      absolute: documentTitle(
        `Project statement ${s.reference}`,
        s.projectTitle,
        s.business.name,
      ),
    },
  };
}

export default function StatementPage({
  params,
}: PageProps<"/projects/[id]/statement">) {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden
          className="mx-auto h-[80vh] max-w-[210mm] bg-white/70"
        />
      }
    >
      <StatementView params={params} />
    </Suspense>
  );
}

async function StatementView({
  params,
}: Pick<PageProps<"/projects/[id]/statement">, "params">) {
  const { id } = await params;
  const [statement, settings] = await Promise.all([
    getStatement(id),
    getDocumentSettings(),
  ]);

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-black/10 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="max-sm:size-11"
              aria-label="Back to project"
            >
              <Link href={`/projects/${id}` as Route}>
                <ArrowLeft aria-hidden />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Project statement</p>
              <p className="truncate text-xs text-muted-foreground">
                Scope, changes and payments on one page, for you or your client.
              </p>
            </div>
          </div>
          <PrintButton />
        </div>
      </div>
      <PrintSetup
        footer={`${statement.business.name} · Project statement ${statement.reference}`}
      />
      <main className="px-0 py-0 sm:px-4 sm:py-4 print:p-0">
        <StatementDocument
          statement={statement}
          accent={settings.style.accent}
          className="mx-auto max-w-[210mm] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] sm:rounded-[2px] print:max-w-none print:shadow-none"
        />
      </main>
    </>
  );
}
