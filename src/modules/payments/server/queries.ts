import "server-only";
import { getWorkspacePlan } from "@/modules/billing/server";
import type { ChangeRequest } from "@/modules/changes";
import { requireWorkspace } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import type { CurrencyCode } from "@/shared/lib/currency";
import { minor, type Minor } from "@/shared/lib/money";
import { signedUrls } from "@/shared/storage/r2";
import type { PaymentMethods } from "../domain/methods";
import type { Payment } from "../domain/payment";
import * as repo from "./repository";
import * as settingsRepo from "./settings-repository";
import {
  scheduleFor,
  type PaymentSchedule,
  type ProjectForSchedule,
} from "./schedule";

/** The workspace's payment methods, with a signed URL for the QR image. */
export async function getPaymentMethods(): Promise<{
  methods: PaymentMethods;
  qrUrl: string | null;
}> {
  const { workspace } = await requireWorkspace();
  return methodsWithQr(workspace.workspaceId);
}

/** Settings → Payments: automatic reminders, and whether the plan has them. */
export async function getAutoReminderSetting(): Promise<{
  included: boolean;
  on: boolean;
}> {
  const { workspace } = await requireWorkspace();
  const ws = workspace.workspaceId;
  const [{ plan }, on] = await Promise.all([
    getWorkspacePlan(ws),
    settingsRepo.findAutoRemindersOn(ws),
  ]);
  return { included: plan.features.automaticReminders, on };
}

/**
 * For the public portal only: the workspace comes from the project found by
 * the link, never from the request.
 */
export async function methodsWithQr(
  workspaceId: string,
): Promise<{ methods: PaymentMethods; qrUrl: string | null }> {
  const { methods, qrKey } = await settingsRepo.findMethods(workspaceId);
  const { qr } = await signedUrls({ qr: qrKey });
  return { methods, qrUrl: qr };
}

/** The signed-in workspace's view of a project's payments. */
export async function getProjectPayments(
  project: ProjectForSchedule,
  changes: readonly ChangeRequest[],
): Promise<PaymentSchedule> {
  const id = parseObjectId(project.id);
  if (!id) {
    return {
      items: [],
      payments: [],
      totals: {
        received: minor(0),
        due: minor(0),
        total: minor(0),
        gst: null,
      },
    };
  }
  const { workspace } = await requireWorkspace();
  return scheduleFor(workspace.workspaceId, id, project, changes);
}

/** Payments still owed across the workspace, oldest first (overview). */
export async function listOwedPayments(): Promise<Payment[]> {
  const { workspace } = await requireWorkspace();
  return (await repo.findOwedPaymentDocs(workspace.workspaceId)).map(
    repo.toPayment,
  );
}

/** Change-request money received so far (before GST), for the overview. */
export async function listReceivedChangeAmounts(): Promise<
  { currency: CurrencyCode; amount: Minor }[]
> {
  const { workspace } = await requireWorkspace();
  return (await repo.findReceivedChangeAmounts(workspace.workspaceId)).map(
    (r) => ({ currency: r.currency, amount: minor(r.amount) }),
  );
}
