import { gstOutcome, type InvoicingSettings } from "@/modules/invoices";
import { gstinState, isIndia, stateName } from "@/shared/lib/india";
import { clientFirstName, type Client } from "../domain/client";

/** The client's contact and billing details, read-only, as a ledger. */
export function ClientSummary({
  client,
  seller,
  defaultCurrency,
}: {
  client: Client;
  seller: Pick<InvoicingSettings, "gstin" | "state">;
  defaultCurrency: string;
}) {
  const abroad = !isIndia(client.country);
  const state = stateName(
    (client.gstin && gstinState(client.gstin)) || client.state || "",
  );
  const rows: [string, string][] = [
    // Phone and email sit under the client's name; here only when missing.
    ...(client.phone ? [] : ([["Phone", "Not added"]] as [string, string][])),
    ...(client.email ? [] : ([["Email", "Not added"]] as [string, string][])),
    ["Bills in", client.currency ?? `Your default (${defaultCurrency})`],
    [
      "Billed to",
      [client.address, abroad ? client.country : state]
        .filter(Boolean)
        .join(", ") || "Not added",
    ],
    ...(abroad
      ? []
      : ([["GSTIN", client.gstin ?? "None"]] as [string, string][])),
    [
      "GST",
      gstOutcome(
        seller,
        { state: client.state, country: client.country, gstin: client.gstin },
        clientFirstName(client),
      ),
    ],
  ];
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase sm:pt-0.5">
            {label}
          </dt>
          <dd className="-mt-2 break-words whitespace-pre-line sm:mt-0">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
