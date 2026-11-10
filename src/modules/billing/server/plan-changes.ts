import "server-only";
import { logAdminChange, type AdminContext } from "@/modules/admin/server";
import { withTransaction } from "@/shared/db/transaction";
import type { Plan } from "../domain/plans";
import * as repo from "./repository";

/**
 * Saves an edited plan in one transaction: the plan, a new price entry if
 * the price changed (the first change also records the price before it),
 * and the admin audit entry.
 */
export async function savePlanChange(
  before: Plan,
  after: Plan,
  changes: string[],
  admin: AdminContext,
): Promise<void> {
  await withTransaction(async (session) => {
    await repo.savePlanDoc(after, admin.email, session);
    if (after.monthlyPrice !== before.monthlyPrice) {
      const now = Date.now();
      if (!(await repo.hasPriceHistory(after.id, session)))
        await repo.addPrice(
          after.id,
          before.monthlyPrice,
          "starting price",
          session,
          new Date(now - 1),
        );
      await repo.addPrice(
        after.id,
        after.monthlyPrice,
        admin.email,
        session,
        new Date(now),
      );
    }
    await logAdminChange(
      admin,
      {
        action: "plan.updated",
        target: after.name,
        href: `/admin/plans/${after.id}`,
        changes,
      },
      session,
    );
  });
}
