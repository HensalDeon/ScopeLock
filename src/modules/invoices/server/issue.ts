import "server-only";
import { ObjectId, type ClientSession } from "mongodb";
import { todayInIndia } from "@/shared/lib/dates";
import { hashSnapshot } from "@/shared/lib/hash";
import { financialYear } from "@/shared/lib/india";
import { taxTotal, invoiceNumber } from "../domain/invoice";
import { buildInvoice } from "../domain/snapshot";
import * as repo from "./repository";

export type IssueInput = Omit<
  Parameters<typeof buildInvoice>[0],
  "number" | "issuedOn"
>;

export type IssuedInvoice = {
  id: ObjectId;
  number: string;
  tax: ReturnType<typeof taxTotal>;
  total: ReturnType<typeof taxTotal>;
};

/**
 * Issues the invoice for a payment request: takes the next number for the
 * financial year and stores the frozen snapshot. Runs inside the same
 * transaction as the payment insert, so a failed request never uses up a
 * number and every request has exactly one invoice.
 */
export async function issueInvoice(
  workspaceId: string,
  ids: { projectId: ObjectId; paymentId: ObjectId },
  input: IssueInput,
  session: ClientSession,
): Promise<IssuedInvoice> {
  const now = new Date();
  const fy = financialYear(now);
  const serial = await repo.nextSerial(workspaceId, fy.key, session);
  const snapshot = buildInvoice({
    ...input,
    number: invoiceNumber(input.settings.prefix, fy.short, serial),
    issuedOn: todayInIndia(now),
  });
  const id = new ObjectId();
  await repo.insertInvoice(
    workspaceId,
    {
      _id: id,
      ...ids,
      ...snapshot,
      issuedAt: now,
      snapshotHash: hashSnapshot(snapshot),
    },
    session,
  );
  return {
    id,
    number: snapshot.number,
    tax: taxTotal(snapshot.tax),
    total: snapshot.total,
  };
}
