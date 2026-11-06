import { formatDateTime } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";
import { DECISION_LABELS, type Approval } from "../domain/approval";

/**
 * The client's answers on a project, newest first. Each record is checked
 * against its fingerprint and signature when the page loads.
 */
export function ApprovalHistory({
  approvals,
  headingId,
}: {
  approvals: (Approval & { intact: boolean })[];
  headingId: string;
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
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-medium">
                <span
                  className={cn(
                    "mr-2 inline-block size-1.5 -translate-y-px rounded-full",
                    a.decision === "approved" ? "bg-brand" : "bg-warning",
                  )}
                  aria-hidden
                />
                {DECISION_LABELS[a.decision]} by {a.decidedBy.name}
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
            <dl className="grid gap-x-6 gap-y-1 font-mono text-[11.5px] text-muted-foreground sm:grid-cols-[auto_1fr]">
              <dt>Email</dt>
              <dd className="truncate">{a.decidedBy.email}</dd>
              <dt>IP address</dt>
              <dd>{a.ip ?? "Not recorded"}</dd>
              <dt>Fingerprint</dt>
              <dd className="truncate" title={a.snapshotHash}>
                {a.snapshotHash.slice(0, 16)}
              </dd>
              <dt>Record check</dt>
              <dd className={a.intact ? "text-foreground" : "text-destructive"}>
                {a.intact
                  ? "Intact: matches what was sent"
                  : "Doesn't match its signature. Contact support."}
              </dd>
            </dl>
          </li>
        ))}
      </ol>
    </section>
  );
}
