import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/list-states";

const LINK =
  "font-medium underline underline-offset-4 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center";

/**
 * New project, when the plan is full: why, the projects that can be
 * archived right now, and a way to ask for more room.
 */
export function PlanFullNotice({
  message,
  ready,
}: {
  message: string;
  /** Projects with nothing waiting on the client. */
  ready: { id: string; name: string }[];
}) {
  return (
    <EmptyState
      title="Your plan is full"
      action={
        <div className="grid gap-4">
          {ready.length > 0 ? (
            <div className="grid gap-1.5 text-sm">
              <p className="font-medium">Ready to archive</p>
              <ul className="grid gap-1">
                {ready.map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}` as Route} className={LINK}>
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground">
                Open one and choose Archive project, under the client card.
              </p>
            </div>
          ) : (
            <p className="text-sm text-pretty text-muted-foreground">
              Every project has something waiting on a client right now, so none
              can be archived yet.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/settings/plan">Plan &amp; usage</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/contact">Need more projects now? Contact us</Link>
            </Button>
          </div>
        </div>
      }
    >
      {message} Archived projects stay readable, and their money still counts in
      your totals. Plans with more projects open soon.
    </EmptyState>
  );
}
