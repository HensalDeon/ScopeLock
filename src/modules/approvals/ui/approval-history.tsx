import Link from "next/link";
import { formatDateTime } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";
import { verdictLabel, type Approval } from "../domain/approval";

/**
 * The client's answers on a project, newest first. Each record is checked
 * against its fingerprint and signature when the page loads.
 */
export function ApprovalHistory({
  approvals,
  headingId,
  projectId,
}: {
  approvals: (Approval & { intact: boolean })[];
  headingId: string;
  projectId: string;
}) {
  if (approvals.length === 0) return null;
  return (
    <section aria-labelledby={headingId} className="grid gap-3">
      <h2 id={headingId} className="text-[15px] font-semibold">
        Client answers
      </h2>
      <ol className="grid gap-3">
        {approvals.map((a) => (
          <li key={a.id} className="grid gap-2 rounded-xl border p-4 text-sm">
            <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
              {a.label}
            </p>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-medium">
                <span
                  className={cn(
                    "mr-2 inline-block size-1.5 -translate-y-px rounded-full",
                    a.decision === "approved" ? "bg-brand" : "bg-warning",
                  )}
                  aria-hidden
                />
                {verdictLabel(a)} by {a.decidedBy.name}
              </p>
              <p className="text-muted-foreground tabular-nums">
                {formatDateTime(a.decidedAt)}
              </p>
            </div>
            {a.comment && (
              <p className="leading-relaxed whitespace-pre-line">
                “{a.comment}”
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link
                href={`/projects/${projectId}/answers/${a.id}`}
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                View the version they saw
              </Link>
              <span
                className={cn(
                  "text-xs",
                  a.intact
                    ? "text-muted-foreground"
                    : "font-medium text-destructive",
                )}
              >
                {a.intact
                  ? "Signed record · intact"
                  : "Signed record doesn't match its signature. Contact support."}
              </span>
            </div>
            <details className="group">
              <summary className="cursor-pointer list-none text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Record details</span>
                <span className="hidden group-open:inline">
                  Hide record details
                </span>
              </summary>
              <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1 font-mono text-[11.5px] text-muted-foreground">
                <dt>Email</dt>
                <dd className="truncate">{a.decidedBy.email}</dd>
                <dt>IP address</dt>
                <dd>{a.ip ?? "Not recorded"}</dd>
                <dt>Fingerprint</dt>
                <dd className="truncate" title={a.snapshotHash}>
                  {a.snapshotHash.slice(0, 16)}
                </dd>
                <dt>Record check</dt>
                <dd
                  className={a.intact ? "text-foreground" : "text-destructive"}
                >
                  {a.intact
                    ? "Intact: matches what was sent"
                    : "Doesn't match its signature. Contact support."}
                </dd>
              </dl>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
