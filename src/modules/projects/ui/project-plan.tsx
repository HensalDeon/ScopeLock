import { formatMoney, sum, type Minor } from "@/shared/lib/money";
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

/** Approved change requests on the schedule (worked out by the changes module). */
export type ScheduleAdditions = {
  byMilestone: Record<string, { label: string; amount: Minor }[]>;
  /** Changes billed as their own payment. */
  dueNow: { label: string; amount: Minor }[];
};

/** When the client pays: the agreed schedule plus approved changes. */
export function MilestoneTable({
  project,
  additions,
}: {
  project: Project;
  additions?: ScheduleAdditions;
}) {
  const money = (amount: Minor) => formatMoney(amount, project.currency);
  const extra = (id: string) => additions?.byMilestone[id] ?? [];
  const withExtras = (id: string, base: Minor) =>
    sum([base, ...extra(id).map((a) => a.amount)]);
  const breakdown = (id: string, base: Minor) =>
    extra(id).length > 0 && (
      <p className="col-span-full col-start-2 text-xs text-muted-foreground tabular-nums">
        {money(base)}
        {extra(id)
          .map((a) => ` + ${a.label} ${money(a.amount)}`)
          .join("")}
      </p>
    );
  const dueNow = additions?.dueNow ?? [];

  const separate = dueNow.map((d) => (
    <li
      key={d.label}
      className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-baseline gap-x-3 px-4 py-3 sm:px-5"
    >
      <span aria-hidden className="font-mono text-xs text-muted-foreground">
        +
      </span>
      <p className="min-w-0 text-sm">
        <span className="font-medium">{d.label}</span>
        <span className="text-muted-foreground"> · separate payment</span>
      </p>
      <p className="min-w-[5.5rem] text-right text-sm font-medium tabular-nums">
        {money(d.amount)}
      </p>
    </li>
  ));

  if (project.billingModel === "upfront") {
    const only = project.milestones[0];
    const base = project.baseline.total;
    return (
      <ol className="divide-y rounded-xl border bg-background">
        <li className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-sm font-medium">Full payment upfront</p>
            <p className="text-sm text-muted-foreground">Before work starts</p>
          </div>
          <p className="text-sm font-medium tabular-nums">
            {money(only ? withExtras(only.id, base) : base)}
          </p>
          {only && extra(only.id).length > 0 && (
            <p className="col-span-full text-xs text-muted-foreground tabular-nums">
              {money(base)}
              {extra(only.id)
                .map((a) => ` + ${a.label} ${money(a.amount)}`)
                .join("")}
            </p>
          )}
        </li>
        {separate}
      </ol>
    );
  }
  return (
    <ol className="divide-y rounded-xl border bg-background">
      {project.milestones.map((milestone, index) => (
        <li
          key={milestone.id}
          className="grid grid-cols-[1.75rem_minmax(0,1fr)_3rem_auto] items-baseline gap-x-3 gap-y-1 px-4 py-3 sm:px-5"
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
            {money(withExtras(milestone.id, milestone.baseAmount))}
          </p>
          {breakdown(milestone.id, milestone.baseAmount)}
        </li>
      ))}
      {separate}
    </ol>
  );
}
