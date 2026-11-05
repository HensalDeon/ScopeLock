import { formatMoney } from "@/shared/lib/money";
import type { Project } from "../domain/project";

/** The agreed scope as the client will see it: lines, notes and the total. */
export function ScopeTable({ project }: { project: Project }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <ol className="divide-y">
        {project.baseline.items.map((item, index) => (
          <li
            key={item.id}
            className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] gap-x-3 px-4 py-3 sm:px-5"
          >
            <span className="pt-px font-mono text-xs text-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
            <p className="text-sm tabular-nums">
              {formatMoney(item.amount, project.currency)}
            </p>
          </li>
        ))}
      </ol>
      <div className="flex items-baseline justify-between gap-4 border-t bg-canvas px-4 py-3.5 sm:px-5">
        <p className="text-sm font-medium">Agreed total</p>
        <p className="text-lg font-semibold tabular-nums">
          {formatMoney(project.baseline.total, project.currency)}
        </p>
      </div>
    </div>
  );
}

/** When the client pays for the agreed scope. */
export function MilestoneTable({ project }: { project: Project }) {
  if (project.billingModel === "upfront") {
    return (
      <div className="rounded-xl border bg-background px-4 py-3.5 sm:px-5">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Full payment upfront</p>
            <p className="text-sm text-muted-foreground">Before work starts</p>
          </div>
          <p className="text-sm font-medium tabular-nums">
            {formatMoney(project.baseline.total, project.currency)}
          </p>
        </div>
      </div>
    );
  }
  return (
    <ol className="divide-y rounded-xl border bg-background">
      {project.milestones.map((milestone, index) => (
        <li
          key={milestone.id}
          className="grid grid-cols-[1.75rem_minmax(0,1fr)_3rem_auto] items-baseline gap-x-3 px-4 py-3 sm:px-5"
        >
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {index + 1}
          </span>
          <p className="min-w-0 truncate text-sm font-medium">
            {milestone.name}
          </p>
          <p className="text-right text-sm text-muted-foreground tabular-nums">
            {milestone.percent}%
          </p>
          <p className="min-w-[5.5rem] text-right text-sm font-medium tabular-nums">
            {formatMoney(milestone.baseAmount, project.currency)}
          </p>
        </li>
      ))}
    </ol>
  );
}
