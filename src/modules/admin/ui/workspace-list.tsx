import type { Route } from "next";
import Link from "next/link";
import { formatDate } from "@/shared/lib/dates";

export type WorkspaceRow = {
  workspaceId: string;
  businessName: string;
  businessType: string;
  createdAt: Date;
  owner: { name: string; email: string } | null;
  plan: string;
  /** Put on the plan by an admin (not paid). */
  given: boolean;
  /** Pays through Razorpay. */
  paying: boolean;
};

/** Admin: workspaces as rows, each opening its page. */
export function WorkspaceList({ rows }: { rows: WorkspaceRow[] }) {
  return (
    <ul className="divide-y rounded-xl border bg-background">
      {rows.map((w) => (
        <li key={w.workspaceId}>
          <Link
            href={`/admin/workspaces/${w.workspaceId}` as Route}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 px-5 py-3.5 transition-colors hover:bg-muted/50"
          >
            <span className="truncate text-sm font-semibold">
              {w.businessName}
            </span>
            <span className="text-right text-sm">
              {w.plan}
              {w.given && (
                <span className="text-muted-foreground"> (given)</span>
              )}
              {w.paying && (
                <span className="text-muted-foreground"> (paying)</span>
              )}
            </span>
            <span className="truncate text-[13px] text-muted-foreground">
              {w.owner
                ? `${w.owner.name} · ${w.owner.email}`
                : "No owner found"}
            </span>
            <span className="text-right text-[12px] text-muted-foreground tabular-nums">
              Since {formatDate(w.createdAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
