import { ClassicDocument } from "@/modules/documents";
import { formatDateTime } from "@/shared/lib/dates";
import { formatMoney, minor } from "@/shared/lib/money";
import { LogoMark } from "@/shared/ui/brand";
import { PrintButton } from "@/shared/ui/print-button";
import { decideProposal } from "../server/actions";
import { getPortalView } from "../server/queries";
import { DecisionPanel } from "./decision-panel";

/** The client's page for a proposal link: the document and their answer. */
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

  const total = formatMoney(minor(data.total), data.currency);

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-black/10 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              Proposal from {business}
            </p>
            <p className="truncate text-xs text-muted-foreground tabular-nums">
              {data.reference} · {total}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {state === "awaiting" && (
              <a
                href="#answer"
                className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
              >
                Approve or ask for changes
              </a>
            )}
            <PrintButton label="Save PDF" />
          </div>
        </div>
      </header>

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

      <main className="px-0 py-0 sm:px-4 sm:py-8 print:p-0">
        <ClassicDocument
          data={data}
          style={view.style}
          images={view.images}
          className="mx-auto max-w-[210mm] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] sm:rounded-sm print:max-w-none print:shadow-none"
        />

        {state === "awaiting" && (
          <section
            id="answer"
            aria-labelledby="answer-heading"
            className="mx-auto mt-0 max-w-[210mm] scroll-mt-20 border-t bg-white px-5 py-8 sm:mt-6 sm:rounded-sm sm:border sm:px-10 print:hidden"
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
              Approving agrees the scope above for {total}. Anything extra later
              comes to you as a separate request with its own price, for you to
              approve or not.
            </p>
            <DecisionPanel
              action={decideProposal.bind(null, token)}
              businessName={business}
              total={total}
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

function StatusStrip({
  tone,
  children,
}: {
  tone: "done" | "waiting";
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={
        tone === "done"
          ? "border-b border-brand/25 bg-success-soft print:hidden"
          : "border-b border-warning/30 bg-warning-soft print:hidden"
      }
    >
      <p
        className={`mx-auto max-w-[210mm] px-4 py-3 text-sm font-medium text-pretty ${tone === "done" ? "text-foreground" : "text-warning-ink"}`}
      >
        {children}
      </p>
    </div>
  );
}

function Notice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center px-5 py-16">
      <div className="mx-auto grid w-full max-w-md gap-3 rounded-lg border bg-white p-6">
        <h1 className="text-lg font-semibold text-balance">{title}</h1>
        <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {children}
        </p>
      </div>
    </main>
  );
}

function Footer() {
  return (
    <footer className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-[#6b6f76] print:hidden">
      <LogoMark className="size-3.5" />
      Sent with ScopeLock
    </footer>
  );
}
