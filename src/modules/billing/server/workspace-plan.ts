import "server-only";
import { logAdminChange, type AdminContext } from "@/modules/admin/server";
import { withTransaction } from "@/shared/db/transaction";
import type { Subscription } from "../domain/subscription";
import { saveSubscription } from "./subscriptions";

/** Admin: put a workspace on a plan, with the audit entry, in one go. */
export async function saveWorkspacePlan(
  workspace: { id: string; name: string },
  subscription: Subscription,
  changes: string[],
  admin: AdminContext,
): Promise<void> {
  await withTransaction(async (session) => {
    await saveSubscription(workspace.id, subscription, session);
    await logAdminChange(
      admin,
      {
        action: "workspace.plan_set",
        target: workspace.name,
        href: `/admin/workspaces/${workspace.id}`,
        changes,
      },
      session,
    );
  });
}
