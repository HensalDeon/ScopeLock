import { currencyLabel } from "@/shared/lib/currency";
import { formatMoney } from "@/shared/lib/money";
import { clampPage, PAGE_SIZE, toPage } from "@/shared/lib/pagination";
import { cn } from "@/shared/lib/utils";
import type {
  CurrencyReport,
  RecoveredReport,
} from "../domain/recovered-report";
import { clientsParam, reportHref, unpaidParam } from "./report-href";
import { ClientTable, MonthTable } from "./report-tables";
import type { Query } from "./report-view";
import { UnpaidList } from "./unpaid-list";

const LABEL =
  "font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase";
const changes = (n: number) => `${n} change request${n === 1 ? "" : "s"}`;

function pageOf<T>(items: readonly T[], requested: number) {
  const page = clampPage(requested, items.length);
  return toPage(
    items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    items.length,
    page,
  );
}

/** One currency's report: figures, by client, not received yet, by month. */
export function CurrencySection({
  report,
  rows,
  year,
  fy,
  query,
  titled,
  clientName,
  now,
}: {
  report: CurrencyReport;
  rows: RecoveredReport["rows"];
  year: string;
  fy: number;
  query: Query;
  /** More than one currency: name each. */
  titled: boolean;
  /** The client "Not received yet" is narrowed to. */
  clientName: string | null;
  now: Date;
}) {
  const money = (n: Parameters<typeof formatMoney>[0]) =>
    formatMoney(n, report.currency);
  const id = `recovered-${report.currency}`;
  const total = "Total";
  const pParam = clientsParam(report.currency);
  const uParam = unpaidParam(report.currency);
  const clientsPage = query.pages[pParam] ?? 1;
  const owing = rows.filter(
    (r) => r.currency === report.currency && r.outstanding > 0,
  );
  const unpaidCount = new Map<string, number>();
  for (const r of owing)
    if (r.clientId)
      unpaidCount.set(r.clientId, (unpaidCount.get(r.clientId) ?? 0) + 1);
  const unpaid = query.client
    ? owing.filter((r) => r.clientId === query.client)
    : owing;
  // Emerald only for money that has arrived: approval isn't payment.
  const figures = [
    {
      label: "Approved",
      value: money(report.approved),
      note: changes(report.count),
      settled: false,
    },
    {
      label: "Received so far",
      value: money(report.received),
      note:
        report.received === report.approved
          ? "All of it"
          : `Of ${money(report.approved)} approved`,
      settled: report.received > 0,
    },
    {
      label: "Still to receive",
      value: money(report.outstanding),
      note:
        report.outstanding === 0
          ? "Nothing left"
          : report.asked === 0
            ? "Not asked for yet"
            : report.notAsked === 0
              ? "All of it asked for"
              : `${money(report.asked)} asked for, ${money(report.notAsked)} not asked yet`,
      settled: false,
    },
  ];
  return (
    <section aria-labelledby={id} className="grid gap-8">
      <h2 id={id} className={titled ? "text-lg font-semibold" : "sr-only"}>
        {currencyLabel(report.currency)}
      </h2>
      {/* Phones: one ledger row per figure (label left, amount right). */}
      <dl className="grid rounded-xl border bg-background px-5 py-2 sm:grid-cols-3 sm:px-0 sm:py-0">
        {figures.map((f) => (
          <div
            key={f.label}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 border-t py-2.5 first:border-t-0 sm:block sm:border-t-0 sm:border-l sm:px-5 sm:py-4 sm:first:border-l-0"
          >
            <dt className={LABEL}>{f.label}</dt>
            <dd
              className={cn(
                "text-lg font-semibold tracking-[-0.02em] tabular-nums sm:mt-1 sm:text-2xl",
                f.settled && "text-success-ink",
              )}
            >
              {f.value}
            </dd>
            <dd className="col-span-2 text-sm text-muted-foreground tabular-nums">
              {f.note}
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-3">
        <div className="grid gap-0.5">
          <h3 id={`${id}-clients`} className="text-[15px] font-semibold">
            By client
          </h3>
          {owing.length > 0 && (
            <p className="text-[13px] text-pretty text-muted-foreground">
              Choose a client to see which change requests they still owe.
            </p>
          )}
        </div>
        <ClientTable
          id={`${id}-clients`}
          page={pageOf(report.clients, clientsPage)}
          totals={report}
          currency={report.currency}
          totalLabel={total}
          href={(n) =>
            reportHref({ fy, client: query.client, pages: { [pParam]: n } })
          }
          rowHref={(clientId) =>
            reportHref({
              fy,
              client: clientId,
              pages: { [pParam]: clientsPage },
              hash: `${id}-unpaid`,
            })
          }
          selected={query.client}
          unpaidCount={unpaidCount}
        />
      </div>
      <UnpaidList
        id={`${id}-unpaid`}
        page={pageOf(unpaid, query.pages[uParam] ?? 1)}
        currency={report.currency}
        client={clientName}
        empty={
          clientName
            ? `Nothing owed by ${clientName}${titled ? ` in ${report.currency}` : ""} for ${year}.`
            : `Every change request approved in ${year} has been paid.`
        }
        allHref={reportHref({
          fy,
          pages: { [pParam]: clientsPage },
          hash: `${id}-unpaid`,
        })}
        href={(n) =>
          reportHref({
            fy,
            client: query.client,
            pages: { [pParam]: clientsPage, [uParam]: n },
            hash: `${id}-unpaid`,
          })
        }
        now={now}
      />
      <div className="grid gap-3">
        <div className="grid gap-0.5">
          <h3 id={`${id}-months`} className="text-[15px] font-semibold">
            By month
          </h3>
          <p className="text-[13px] text-pretty text-muted-foreground">
            By the month the client approved. Received counts payments for those
            change requests, whenever they arrived.
          </p>
        </div>
        <MonthTable
          id={`${id}-months`}
          months={report.months}
          totals={report}
          currency={report.currency}
          totalLabel={total}
        />
      </div>
    </section>
  );
}
