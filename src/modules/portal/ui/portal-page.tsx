import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ActivityTimeline } from "@/modules/activity";
import { changeLabel } from "@/modules/changes";
import { ClassicDocument, approvalAmount } from "@/modules/documents";
import { PortalNextStep } from "./portal-next-step";
import { ChangeRow, PaymentRow } from "./portal-rows";
import { PortalTotals } from "./portal-totals";
import { formatDateTime } from "@/shared/lib/dates";
import { formatMoney, minor, sum } from "@/shared/lib/money";
import { PrintButton } from "@/shared/ui/print-button";
import { decideProposal } from "../server/actions";
import { getPortalView } from "../server/queries";
import { DecisionPanel } from "./decision-panel";
import { Footer, Notice, PortalHeader, StatusStrip } from "./portal-chrome";
import { PrintSetup } from "@/shared/ui/print-setup";

/** The client's page for a link: the proposal, its changes and history. */
export async function PortalPage({ token }: { token: string }) {
  const view = await getPortalView(token);

  if (view.state === "limited") {
    return (
      <Notice title="Too many requests from this connection">
        Wait about 10 minutes, then reload this page.
      </Notice>
    );
  }

  const { data, state, decision } = view;
  const business = data.business.name;

  if (state === "updating") {
    return (
      <Notice title={`${business} is updating this proposal`}>
        They took it back to make changes. When they send it again, the new
        version opens at this same link.
      </Notice>
    );
  }

  const money = (amount: number) => formatMoney(minor(amount), data.currency);
  const projectTotal = sum([
    minor(data.total),
    minor(view.totals.approvedChanges),
  ]);
  const waiting = view.changes.filter((c) => c.status === "sent");
  // One headline total: with GST once approved (the figure the client pays).
  const gstTax = view.payments?.totals.gst?.tax ?? 0;
  const headline =
    state === "approved"
      ? sum([projectTotal, minor(gstTax)])
      : minor(data.total);

  return (
    <>
      <PortalHeader
        title={`Proposal from ${business}`}
        detail={`${data.title} · ${money(headline)} ${
          state !== "approved"
            ? "proposal"
            : gstTax > 0
              ? "project total with GST"
              : "project total"
        }`}
      >
        {state === "awaiting" && (
          <a
            href="#answer"
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80 max-sm:h-11 max-sm:px-4"
          >
            Approve or ask for changes
          </a>
        )}
        <PrintButton label="Save proposal PDF" variant="outline" />
      </PortalHeader>

      {state === "approved" && decision && (
        <StatusStrip tone="done">
          Approved by {decision.name} on {formatDateTime(decision.at)}.
        </StatusStrip>
      )}
      {state === "changes-requested" && decision && (
        <StatusStrip tone="waiting">
          You asked for changes on {formatDateTime(decision.at)}. {business}{" "}
          will send an updated proposal to this same link.
        </StatusStrip>
      )}

      <PrintSetup cover footer={`${business} · Proposal ${data.reference}`} />
      <main className="px-0 py-0 sm:px-4 sm:py-8 print:p-0">
        {state === "approved" && (
          <div className="mx-auto mb-0 grid max-w-[210mm] grid-cols-[minmax(0,1fr)] gap-6 border-b bg-white px-5 py-7 sm:mb-6 sm:rounded-[2px] sm:border sm:px-10 print:hidden">
            {waiting.length > 0 && (
              <section aria-labelledby="waiting-heading" className="grid gap-3">
                <h2 id="waiting-heading" className="text-base font-semibold">
                  Waiting for your answer
                </h2>
                <ul className="grid gap-2">
                  {waiting.map((c) => (
                    <li key={c.id} className="min-w-0">
                      <Link
                        href={`/c/${token}/changes/${c.number}`}
                        className="flex min-w-0 items-center gap-3 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 hover:border-warning"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-[11px] tracking-[0.12em] text-warning-ink uppercase">
                            {changeLabel(c.number)}
                          </span>
                          <span className="line-clamp-2 block text-[15px] font-medium break-words">
                            {c.title}
                          </span>
                        </span>
                        <span className="shrink-0 text-[15px] font-semibold tabular-nums">
                          {money(c.total)}
                        </span>
                        <span className="hidden text-sm font-medium sm:inline">
                          Review
                        </span>
                        <ChevronRight aria-hidden className="size-4 shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {view.payments && view.payments.items.length > 0 && (
              <PortalNextStep
                items={view.payments.items}
                token={token}
                business={business}
                money={money}
              />
            )}

            <PortalTotals
              proposalTotal={minor(data.total)}
              approvedChanges={minor(view.totals.approvedChanges)}
              payments={view.payments?.totals ?? null}
              money={money}
            />
            <Link
              href={`/c/${token}/statement`}
              className="justify-self-start text-sm font-medium underline underline-offset-4 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
            >
              Project statement: every change and payment on one page
            </Link>

            {view.payments && view.payments.items.length > 0 && (
              <section
                aria-labelledby="payments-heading"
                className="grid gap-2"
              >
                <h2 id="payments-heading" className="text-base font-semibold">
                  Payments
                </h2>
                <ul className="divide-y rounded-lg border">
                  {view.payments.items.map((item) => (
                    <PaymentRow
                      key={item.key}
                      item={item}
                      token={token}
                      money={money}
                    />
                  ))}
                </ul>
              </section>
            )}

            {view.changes.length > 0 && (
              <section aria-labelledby="changes-heading" className="grid gap-2">
                <h2 id="changes-heading" className="text-base font-semibold">
                  Change requests
                </h2>
                <ul className="divide-y rounded-lg border">
                  {view.changes.map((c) => (
                    <ChangeRow
                      key={c.id}
                      change={c}
                      token={token}
                      money={money}
                    />
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="history-heading" className="grid gap-3">
              <h2 id="history-heading" className="text-base font-semibold">
                History
              </h2>
              <ActivityTimeline
                items={view.history}
                empty="Your approvals and change requests will appear here."
              />
            </section>
          </div>
        )}

        <ClassicDocument
          note={view.gstNote}
          data={data}
          acceptance={
            state === "approved" && decision
              ? {
                  verdict: "Approved",
                  name: decision.name,
                  email: null,
                  at: decision.at,
                  comment: decision.comment,
                }
              : null
          }
          style={view.style}
          images={view.images}
          className="mx-auto max-w-[210mm] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] sm:rounded-[2px] print:max-w-none print:shadow-none"
        />

        {state === "awaiting" && (
          <section
            id="answer"
            tabIndex={-1}
            aria-labelledby="answer-heading"
            className="mx-auto mt-0 max-w-[210mm] scroll-mt-20 border-t bg-white px-5 py-8 outline-none sm:mt-6 sm:rounded-[2px] sm:border sm:px-10 print:hidden"
          >
            <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              Your answer
            </p>
            <h2
              id="answer-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.01em] text-balance"
            >
              Approve this proposal, or ask for changes
            </h2>
            <p className="mt-2 mb-6 max-w-prose text-[15px] leading-relaxed text-pretty text-muted-foreground">
              Approving agrees the scope above for {money(data.total)}. Anything
              extra later comes to you as a separate request with its own price,
              for you to approve or not.
            </p>
            <DecisionPanel
              kind="proposal"
              action={decideProposal.bind(null, token)}
              businessName={business}
              total={approvalAmount(
                minor(data.total),
                data.gstPercent,
                data.currency,
              )}
              defaults={{
                name: data.client?.name ?? "",
                email: data.client?.email ?? "",
              }}
            />
          </section>
        )}
      </main>
      <Footer branded={view.branded} />
    </>
  );
}
