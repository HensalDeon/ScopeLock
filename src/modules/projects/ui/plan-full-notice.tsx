import type { Route } from "next";
import Link from "next/link";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, minor } from "@/shared/lib/money";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/list-states";
import type { ArchivableState } from "../domain/archive";

const LINK =
  "font-medium underline underline-offset-4 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center";

export type ArchivableProject = {
  id: string;
  name: string;
  currency: CurrencyCode;
  state: ArchivableState;
};

/** What archiving each one would leave behind, in a few words. */
function stateText(p: ArchivableProject): string {
  switch (p.state.kind) {
    case "paid":
      return "Fully paid";
    case "draft":
      return "Draft, never sent: you could delete it instead";
    case "to_ask":
      return `${formatMoney(minor(p.state.amount), p.currency)} not asked for yet`;
  }
}

/**
 * New project, when the plan is full: why, the next plan up when paid
 * plans are open, and the projects that could be archived now (with what
 * that would leave behind).
 */
export function PlanFullNotice({
  message,
  ready,
  upgrade,
}: {
  message: string;
  ready: ArchivableProject[];
  /** The next plan up, when paid plans can be bought. */
  upgrade: { name: string; price: string; projects: number } | null;
}) {
  return (
    <EmptyState
      title="Your plan is full"
      action={
        <div className="grid gap-5">
          <div className="flex flex-wrap gap-2">
            {upgrade && (
              <Button asChild>
                <Link href="/settings/plan">
                  Upgrade to {upgrade.name}: {upgrade.projects} active projects
                  for {upgrade.price} a month
                </Link>
              </Button>
            )}
            <Button asChild variant={upgrade ? "ghost" : "outline"}>
              <Link href="/contact">Need more projects now? Contact us</Link>
            </Button>
          </div>
          {ready.length > 0 ? (
            <div className="grid gap-2 text-sm">
              <p className="font-medium">
                Or archive one. Can be archived now:
              </p>
              <ul className="grid divide-y rounded-lg border bg-background">
                {ready.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-2.5"
                  >
                    <Link href={`/projects/${p.id}` as Route} className={LINK}>
                      {p.name}
                    </Link>
                    <span className="text-muted-foreground tabular-nums">
                      {stateText(p)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground">
                Archive project is on each project&apos;s page, under the client
                card. Archived projects stay readable, and their money still
                counts in your totals.
              </p>
            </div>
          ) : (
            <p className="text-sm text-pretty text-muted-foreground">
              Every project has something waiting on a client right now, so none
              can be archived yet.
            </p>
          )}
        </div>
      }
    >
      {message}
      {upgrade ? "" : " Plans with more projects open soon."}
    </EmptyState>
  );
}
