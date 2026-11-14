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

/** Newest first; only one kind ("plan.updated") or one thing (its page). */
export async function listAdminChanges(
  page: number,
  only: { action?: string; href?: string } = {},
): Promise<Page<AuditEntry>> {
  const filter = {
    ...(only.action ? { action: only.action } : {}),
    ...(only.href ? { href: only.href } : {}),
  };
  return paginate(
    page,
    () => audit().countDocuments(filter),
    async ({ skip, limit }) =>
      (
        await audit()
          .find(filter, { sort: { at: -1, _id: -1 }, skip, limit })
          .toArray()
      ).map(({ _id, ...d }) => ({ ...d, id: String(_id) })),
  );
}
