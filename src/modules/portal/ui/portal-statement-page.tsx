import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StatementDocument } from "@/modules/statement";
import { PrintButton } from "@/shared/ui/print-button";
import { PrintSetup } from "@/shared/ui/print-setup";
import { getPortalStatement } from "../server/queries";
import { Footer, Notice, PortalHeader } from "./portal-chrome";

/** The project statement on the client's link, ready to print or save. */
export async function PortalStatementPage({ token }: { token: string }) {
  const view = await getPortalStatement(token);
  if (view.state === "limited") {
    return (
      <Notice title="Too many requests from this connection">
        Wait about 10 minutes, then reload this page.
      </Notice>
    );
  }
  const { statement } = view;
  return (
    <>
      <PortalHeader
        title="Project statement"
        detail={`${statement.projectTitle} · ${statement.business.name}`}
        back={
          <Link
            href={`/c/${token}`}
            aria-label="Back to the proposal"
            className="-ml-2 flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted max-sm:size-11"
          >
            <ArrowLeft aria-hidden className="size-4" />
          </Link>
        }
      >
        <PrintButton variant="outline" />
      </PortalHeader>
      <PrintSetup
        footer={`${statement.business.name} · Project statement ${statement.reference}`}
      />
      <main className="px-0 py-0 sm:px-4 sm:py-6 print:p-0">
        <StatementDocument
          statement={statement}
          accent={view.accent}
          className="mx-auto max-w-[210mm] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] sm:rounded-[2px] print:max-w-none print:shadow-none"
        />
      </main>
      <Footer branded={view.branded} />
    </>
  );
}
