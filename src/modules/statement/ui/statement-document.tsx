import { formatDate } from "@/shared/lib/dates";
import { formatMoney, type Minor } from "@/shared/lib/money";
import { formatPhone } from "@/shared/lib/phone";
import { cn } from "@/shared/lib/utils";
import type { Statement } from "../domain/statement";

/**
 * The project statement as a document: agreed scope, changes, payments
 * and the totals, plain like an invoice (it's an accounts page, not a
 * pitch). Same markup on screen, in the portal and in print.
 */
export function StatementDocument({
  statement: s,
  accent,
  className,
}: {
  statement: Statement;
  /** The workspace's document accent, for the top rule. */
  accent: string;
  className?: string;
}) {
  const money = (amount: Minor) => formatMoney(amount, s.currency);
  return (
    <article
      className={cn(
        "@container border-t-4 bg-white px-6 py-8 text-[#1d1f24] [print-color-adjust:exact] @xl:px-12 @xl:py-10",
        className,
      )}
      style={{ borderTopColor: accent }}
    >
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="grid gap-1">
          <p className="font-medium">{s.business.name}</p>
          <p className="text-[0.85rem] text-[#3a3d44]">
            {[
              s.business.email,
              s.business.phone && formatPhone(s.business.phone),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="grid gap-1 text-right">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            Project statement
          </h1>
          <p className="font-mono text-[0.85rem] tabular-nums">
            {s.reference} · as of {formatDate(s.asOf, { withYear: true })}
          </p>
        </div>
      </header>

      <dl className="mt-8 grid gap-4 border-y py-4 text-[0.9rem] @md:grid-cols-3">
        <Meta label="Project">{s.projectTitle}</Meta>
        <Meta label="For">
          {s.client
            ? [s.client.name, s.client.company].filter(Boolean).join(", ")
            : "No client"}
        </Meta>
        <Meta label="Agreed scope">
          {money(s.agreed.total)}
          {s.agreed.approvedBy && (
            <span className="block text-[13px] text-[#6b6f78]">
              Approved by {s.agreed.approvedBy.name} on{" "}
              {formatDate(s.agreed.approvedBy.at, { withYear: true })}
            </span>
          )}
        </Meta>
      </dl>

      <Section title="Changes">
        {s.changeRows.length === 0 ? (
          <Empty>No change requests on this project.</Empty>
        ) : (
          s.changeRows.map((r) => (
            <Line
              key={r.label}
              lead={r.label}
              title={r.title}
              status={r.status}
              amount={money(r.amount)}
              muted={!r.counts}
            />
          ))
        )}
      </Section>

      <Section title="Payments">
        {s.paymentRows.length === 0 ? (
          <Empty>The payment schedule starts once the scope is approved.</Empty>
        ) : (
          s.paymentRows.map((r, i) => (
            <Line
              key={`${r.label}-${i}`}
              lead={String(i + 1).padStart(2, "0")}
              title={r.invoice ? `${r.label} · invoice ${r.invoice}` : r.label}
              status={r.status}
              amount={money(r.amount)}
            />
          ))
        )}
      </Section>

      <dl className="mt-8 ml-auto grid max-w-sm gap-1.5 text-[0.9rem] tabular-nums">
        <Row label="Agreed scope">{money(s.totals.agreed)}</Row>
        <Row label="Approved changes">{money(s.totals.approvedChanges)}</Row>
        <Row label="Project total (before GST)" strong>
          {money(s.totals.projectTotal)}
        </Row>
        {s.totals.tax > 0 && (
          <>
            <Row label="GST on invoices">{money(s.totals.tax)}</Row>
            <Row label="Total with GST" strong>
              {money(s.totals.withGst)}
            </Row>
          </>
        )}
        <div className="mt-2 grid gap-1.5 border-t pt-2">
          <Row label="Received">{money(s.totals.received)}</Row>
          <Row label="Asked for, not received">{money(s.totals.due)}</Row>
          <Row label="Not asked for yet">{money(s.totals.toAsk)}</Row>
        </div>
      </dl>

      <footer className="mt-10 border-t pt-4 text-[13px] text-pretty text-[#3a3d44]">
        Every approval above is kept as a signed record of exactly what was
        approved, by whom and when. Amounts with GST follow the invoices.
      </footer>
    </article>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <dt className="text-[11px] font-medium tracking-[0.16em] text-[#6b6f78] uppercase">
        {label}
      </dt>
      <dd className="text-pretty">{children}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 grid [break-inside:auto] gap-0">
      <h2 className="mb-2 text-[11px] font-medium tracking-[0.16em] text-[#6b6f78] uppercase">
        {title}
      </h2>
      <ul className="divide-y border-y">{children}</ul>
    </section>
  );
}

function Line({
  lead,
  title,
  status,
  amount,
  muted = false,
}: {
  lead: string;
  title: string;
  status: string;
  amount: string;
  muted?: boolean;
}) {
  return (
    <li className="grid [break-inside:avoid] grid-cols-[3.5rem_minmax(0,1fr)_auto] items-baseline gap-x-3 py-2.5 text-[0.9rem]">
      <span className="font-mono text-[13px] text-[#6b6f78] tabular-nums">
        {lead}
      </span>
      <span className="min-w-0">
        <span className="block text-pretty">{title}</span>
        <span className="block text-[13px] text-[#6b6f78]">{status}</span>
      </span>
      <span
        className={cn(
          "text-right tabular-nums",
          muted && "text-[#9a9ea6] line-through",
        )}
      >
        {amount}
      </span>
    </li>
  );
}

function Row({
  label,
  children,
  strong = false,
}: {
  label: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={cn("flex justify-between gap-6", strong && "font-semibold")}
    >
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <li className="py-2.5 text-[0.9rem] text-[#6b6f78]">{children}</li>;
}
