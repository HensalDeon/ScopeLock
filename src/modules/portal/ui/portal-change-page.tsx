import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { changeLabel } from "@/modules/changes";
import { ChangeOrderDocument, approvalAmount } from "@/modules/documents";
import { formatDateTime } from "@/shared/lib/dates";
import { formatMoney } from "@/shared/lib/money";
import { PrintButton } from "@/shared/ui/print-button";
import { decideChange } from "../server/change-decision";
import { getPortalChange } from "../server/queries";
import { DecisionPanel } from "./decision-panel";
import { Footer, Notice, PortalHeader, StatusStrip } from "./portal-chrome";
import { PrintSetup } from "@/shared/ui/print-setup";

/** One change request on the client's link: the change order and an answer. */
export async function PortalChangePage({
  token,
  number,
}: {
  token: string;
  number: string;
}) {
  const view = await getPortalChange(token, number);
  if (view.state === "limited") {
    return (
      <Notice title="Too many requests from this connection">
        Wait about 10 minutes, then reload this page.
      </Notice>
    );
  }
  const { change, data, businessName } = view;
  const label = changeLabel(change.number);
  const back = (
    <Link
      href={`/c/${token}`}
      aria-label={`Back to ${view.projectTitle}`}
      className="-ml-2 flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted max-sm:size-11"
    >
      <ArrowLeft aria-hidden className="size-4" />
    </Link>
  );

  if (!data) {
    return (
      <Notice
        title={`${businessName} is updating ${label}`}
        action={
          <Link
            href={`/c/${token}`}
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Back to the project
          </Link>
        }
      >
        They took this change request back to adjust it. When they send it
        again, it opens at this same link.
      </Notice>
    );
  }

  const total = formatMoney(data.total, data.currency);
  const decision = change.decision;

  return (
    <>
      <PortalHeader
        title={`${label} from ${businessName}`}
        detail={`${view.projectTitle} · ${total}`}
        back={back}
      >
        {change.status === "sent" && (
          <a
            href="#answer"
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Approve or decline
          </a>
        )}
        <PrintButton variant="outline" />
      </PortalHeader>

      {change.status === "approved" && decision && (
        <StatusStrip tone="done">
          Approved by {decision.name} on {formatDateTime(decision.at)}.
        </StatusStrip>
      )}
      {change.status === "rejected" && decision && (
        <StatusStrip tone="neutral">
          Declined by {decision.name} on {formatDateTime(decision.at)}. Nothing
          was added to the project.
        </StatusStrip>
      )}
      {change.status === "withdrawn" && (
        <StatusStrip tone="neutral">
          {businessName} cancelled this change request. Nothing was added to the
          project.
        </StatusStrip>
      )}

      {data && (
        <PrintSetup
          cover
          footer={`${businessName} · ${data.reference} · Proposal ${data.projectReference}`}
        />
      )}
      <main className="px-0 py-0 sm:px-4 sm:py-8 print:p-0">
        <ChangeOrderDocument
          data={data}
          approved={change.status === "approved"}
          acceptance={
            decision
              ? {
                  verdict:
                    decision.decision === "approved" ? "Approved" : "Declined",
                  name: decision.name,
                  email: null,
                  at: decision.at,
                }
              : null
          }
          style={view.style}
          images={view.images}
          className="mx-auto max-w-[210mm] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] sm:rounded-[2px] print:max-w-none print:shadow-none"
        />
        {change.status === "sent" && (
          <section
            id="answer"
            aria-labelledby="answer-heading"
            className="mx-auto mt-0 max-w-[210mm] scroll-mt-20 border-t bg-white px-5 py-8 sm:mt-6 sm:rounded-[2px] sm:border sm:px-10 print:hidden"
          >
            <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              Your answer
            </p>
            <h2
              id="answer-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.01em] text-balance"
            >
              Approve {label}, or decline it
            </h2>
            <p className="mt-2 mb-6 max-w-prose text-[15px] leading-relaxed text-pretty text-muted-foreground">
              {data.billing} Your original proposal stays as agreed either way.
            </p>
            <DecisionPanel
              kind="change"
              action={decideChange.bind(null, token, change.number)}
              businessName={businessName}
              total={approvalAmount(data.total, data.gstPercent, data.currency)}
              defaults={{
                name: data.client?.name ?? "",
                email: data.client?.email ?? "",
              }}
            />
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
