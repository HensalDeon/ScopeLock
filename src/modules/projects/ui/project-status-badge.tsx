import { cn } from "@/shared/lib/utils";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "../domain/project";

/**
 * Status colours follow the visual system: amber while waiting on the
 * client, emerald only once the scope is approved, neutral otherwise.
 */
const STYLES: Record<ProjectStatus, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  awaiting_approval: "border-warning/25 bg-warning-soft text-warning-ink",
  active: "border-brand/25 bg-success-soft text-foreground",
  completed: "border-border bg-background text-muted-foreground",
  archived: "border-border bg-background text-muted-foreground",
};

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
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
      {status === "awaiting_approval" && (
        <span aria-hidden className="size-1.5 rounded-full bg-warning" />
      )}
      {status === "active" && (
        <span aria-hidden className="size-1.5 rounded-full bg-brand" />
      )}
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}
