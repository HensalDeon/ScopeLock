import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { clientLabel } from "@/modules/clients";
import { formatDate } from "@/shared/lib/dates";
import { formatMoney, sum } from "@/shared/lib/money";
import type { Project } from "../domain/project";
import { ProjectStatusBadge } from "./project-status-badge";

type Row = Project & {
  client?: { name: string; company: string | null } | null;
};

/**
 * Projects with client, total, status and last change. The total includes
 * approved changes (same number as the project page); changes still waiting
 * on the client show as a note, not in the total. Server component.
 */
export function ProjectList({
  projects,
  showClient = true,
}: {
  projects: Row[];
  showClient?: boolean;
}) {
  return (
    <ul className="divide-y rounded-xl border bg-background">
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/projects/${project.id}`}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3.5 transition-colors hover:bg-canvas sm:grid-cols-[minmax(0,1fr)_auto_auto_1rem] sm:px-5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{project.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {showClient && project.client
                  ? clientLabel(project.client)
                  : `Updated ${formatDate(project.updatedAt)}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium tabular-nums">
                {formatMoney(
                  sum([project.baseline.total, project.totals.approvedChanges]),
                  project.currency,
                )}
              </p>
              {project.totals.pendingChanges > 0 && (
                <p className="text-xs text-warning-ink tabular-nums">
                  +{" "}
                  {formatMoney(project.totals.pendingChanges, project.currency)}{" "}
                  waiting
                </p>
              )}
            </div>
            <ProjectStatusBadge
              status={project.status}
              className="col-start-1 row-start-2 w-fit sm:col-start-3 sm:row-start-1"
            />
            <ChevronRight
              className="hidden size-4 text-muted-foreground sm:block"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
