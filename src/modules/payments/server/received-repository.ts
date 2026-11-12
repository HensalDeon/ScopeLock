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

/** The same lines, each with its change request (the recovered report). */
export async function findReceivedChangeLines(
  workspaceId: string,
): Promise<{ changeId: string; amount: number }[]> {
  const docs = await payments(workspaceId)
    .find(
      { status: "confirmed", "lines.kind": "change_request" },
      { projection: { lines: 1 } },
    )
    .toArray();
  return docs.flatMap((d) =>
    d.lines
      .filter((l) => l.kind === "change_request")
      .map((l) => ({ changeId: l.refId, amount: l.amount })),
  );
}
