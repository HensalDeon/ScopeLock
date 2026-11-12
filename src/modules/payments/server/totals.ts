import "server-only";
import type { ObjectId } from "mongodb";
import { setPaymentTotals } from "@/modules/projects/server";
import { closedKeys, paymentTotals } from "../domain/payment";
import { findPaymentDocs, toPayment } from "./repository";

/** Recomputes the project's received / owed totals from its payments. */
export async function refreshPaymentTotals(
  workspaceId: string,
  projectId: ObjectId,
) {
  const payments = (await findPaymentDocs(workspaceId, projectId)).map(
    toPayment,
  );
  const { received, due } = paymentTotals(payments);
  await setPaymentTotals(workspaceId, projectId, {
    paid: received,
    due,
    closedKeys: closedKeys(payments),
  });
}

/** Emails never break the action they follow. */
export async function sendQuietly(send: () => Promise<void>) {
  try {
    await send();
  } catch (error) {
    console.error("[payments] email not sent", error);
  }
}
