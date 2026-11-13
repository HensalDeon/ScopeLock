import "server-only";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection } from "@/shared/db/scoped";
import type { CurrencyCode } from "@/shared/lib/currency";
import type { PaymentDoc } from "./repository";

/** Change-request money received: for "revenue recovered" and its report. */

const payments = (workspaceId: string) =>
  scopedCollection<PaymentDoc>(COLLECTIONS.payments, workspaceId);

/**
 * Change-request money that has been received: the CR lines of confirmed
 * payments (the work's value, before GST), for "revenue recovered".
 */
export async function findReceivedChangeAmounts(
  workspaceId: string,
): Promise<{ currency: CurrencyCode; amount: number }[]> {
  const docs = await payments(workspaceId)
    .find(
      { status: "confirmed", "lines.kind": "change_request" },
      { projection: { currency: 1, lines: 1 } },
    )
    .toArray();
  return docs.flatMap((d) =>
    d.lines
      .filter((l) => l.kind === "change_request")
      .map((l) => ({ currency: d.currency, amount: l.amount })),
  );
}

/**
 * Every change-request line on a payment that's asked for or received, for
 * the recovered report: how much of each change is received, how much is
 * asked for and still due, its invoice and when it was received.
 */
export async function findChangeLinePayments(workspaceId: string): Promise<
  {
    changeId: string;
    amount: number;
    state: "received" | "asked";
    invoice: string | null;
    /** "2026-11-18", for received ones. */
    receivedOn: string | null;
  }[]
> {
  const docs = await payments(workspaceId)
    .find(
      {
        status: { $in: ["due", "client_reported", "confirmed"] },
        "lines.kind": "change_request",
      },
      {
        projection: {
          lines: 1,
          status: 1,
          "invoice.number": 1,
          "confirmation.receivedOn": 1,
        },
      },
    )
    .toArray();
  return docs.flatMap((d) =>
    d.lines
      .filter((l) => l.kind === "change_request")
      .map((l) => ({
        changeId: l.refId,
        amount: l.amount,
        state:
          d.status === "confirmed" ? ("received" as const) : ("asked" as const),
        invoice: d.invoice?.number ?? null,
        receivedOn:
          d.status === "confirmed"
            ? (d.confirmation?.receivedOn ?? null)
            : null,
      })),
  );
}
