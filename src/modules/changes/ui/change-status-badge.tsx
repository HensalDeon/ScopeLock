import { cn } from "@/shared/lib/utils";
import {
  CHANGE_STATUS_LABELS,
  type ChangeStatus,
} from "../domain/change-request";

const STYLES: Record<ChangeStatus, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  sent: "border-warning/25 bg-warning-soft text-warning-ink",
  approved: "border-brand/25 bg-success-soft text-foreground",
  rejected: "border-border bg-background text-muted-foreground",
  withdrawn: "border-border bg-background text-muted-foreground",
};

export function ChangeStatusBadge({
  status,
  className,
}: {
  status: ChangeStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
        STYLES[status],
        className,
      )}
    >
      {status === "sent" && (
        <span aria-hidden className="size-1.5 rounded-full bg-warning" />
      )}
      {status === "approved" && (
        <span aria-hidden className="size-1.5 rounded-full bg-brand" />
      )}
      {CHANGE_STATUS_LABELS[status]}
    </span>
  );
}
