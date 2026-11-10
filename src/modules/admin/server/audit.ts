import "server-only";
import type { ClientSession, ObjectId } from "mongodb";
import { platformCollection } from "@/shared/db/platform";
import { paginate, type Page } from "@/shared/lib/pagination";
import type { AdminContext } from "./access";

/**
 * The admin audit log: who changed what, when. Insert-only (no update or
 * delete path), like approval records.
 */
type AuditDoc = {
  _id?: ObjectId;
  at: Date;
  by: string;
  /** "plan.updated", "workspace.plan_set"… */
  action: string;
  /** What it was about, as named at the time ("Pro", a workspace's name). */
  target: string;
  /** Its admin page, so entries stay tied to it after a rename. */
  href?: string;
  changes: string[];
};

export type AuditEntry = Omit<AuditDoc, "_id"> & { id: string };

const audit = () => platformCollection<AuditDoc>("adminAudit");

export async function logAdminChange(
  admin: AdminContext,
  entry: Pick<AuditDoc, "action" | "target" | "changes" | "href">,
  session?: ClientSession,
): Promise<void> {
  await audit().insertOne(
    { at: new Date(), by: admin.email, ...entry },
    { session },
  );
}

export async function listAdminChanges(
  page: number,
): Promise<Page<AuditEntry>> {
  return paginate(
    page,
    () => audit().countDocuments(),
    async ({ skip, limit }) =>
      (
        await audit()
          .find({}, { sort: { at: -1, _id: -1 }, skip, limit })
          .toArray()
      ).map(({ _id, ...d }) => ({ ...d, id: String(_id) })),
  );
}
