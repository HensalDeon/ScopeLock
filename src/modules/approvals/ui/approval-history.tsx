import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { formatDateTime } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";
import { verdictLabel, type Approval } from "../domain/approval";

type Checked = Approval & { intact: boolean };

const versionHref = (projectId: string, id: string) =>
  `/projects/${projectId}/answers/${id}` as Route;

function Dot({ decision }: { decision: Approval["decision"] }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        decision === "approved" ? "bg-brand" : "bg-muted-foreground/40",
      )}
    />
  );
}

/**
 * The client's answers as compact rows, for the project page: what was
 * answered, the verdict, who and when, and a link to the exact version.
 * A record that fails its check is flagged right in the row.
 */
export function ApprovalRows({
  approvals,
  projectId,
}: {
  approvals: Checked[];
  projectId: string;
}) {
  return (
    <ol className="divide-y rounded-xl border bg-background">
      {approvals.map((a) => (
        <li key={a.id}>
          <Link
            href={versionHref(projectId, a.id)}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-canvas sm:px-5"
          >
            <span className="grid min-w-0 gap-0.5">
              <ApprovalLabel label={a.label} />
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <Dot decision={a.decision} />
                <span className="truncate">
                  <span className="font-medium">{verdictLabel(a)}</span> by{" "}
                  {a.decidedBy.name}
                </span>
              </span>
              {a.comment && (
                <span className="truncate text-sm text-muted-foreground">
                  “{a.comment}”
                </span>
              )}
              {!a.intact && (
                <span className="text-xs font-medium text-destructive">
                  Doesn&apos;t match its signature. Contact support.
                </span>
              )}
            </span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground tabular-nums">
              {formatDateTime(a.decidedAt)}
              <ChevronRight aria-hidden className="size-4" />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/**
 * Each answer in full, for the signed records page: the note, the record's
 * details (email, IP, fingerprint) and its integrity check.
 */
export function ApprovalCards({
  approvals,
  projectId,
}: {
  approvals: Checked[];
  projectId: string;
}) {
  return (
    <ol className="grid gap-3">
      {approvals.map((a) => (
        <li
          key={a.id}
          className="grid gap-2 rounded-xl border p-4 text-sm sm:p-5"
        >
          <p className="min-w-0">
            <ApprovalLabel label={a.label} />
          </p>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="flex items-center gap-2 font-medium">
              <Dot decision={a.decision} />
              {verdictLabel(a)} by {a.decidedBy.name}
            </p>
            <p className="text-muted-foreground tabular-nums">
              {formatDateTime(a.decidedAt)}
            </p>
          </div>
          {a.comment && (
            <p className="leading-relaxed whitespace-pre-line">“{a.comment}”</p>
          )}
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1 font-mono text-xs text-muted-foreground">
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
          <Link
            href={versionHref(projectId, a.id)}
            className="justify-self-start font-medium underline-offset-4 hover:underline"
          >
            View the version they saw
          </Link>
        </li>
      ))}
    </ol>
  );
}

/**
 * "CR-002 Logo refresh": the reference in mono capitals (it's an id), the
 * client-facing title in normal case beside it, never shouted.
 */
function ApprovalLabel({ label }: { label: string }) {
  const match = /^(CR-\d+)\s+(.*)$/.exec(label);
  const ref = match ? match[1] : label;
  const title = match ? match[2] : null;
  return (
    <span className="flex min-w-0 items-baseline gap-2">
      <span className="shrink-0 font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
        {ref}
      </span>
      {title && (
        <span className="truncate text-xs text-muted-foreground">{title}</span>
      )}
    </span>
  );
}
