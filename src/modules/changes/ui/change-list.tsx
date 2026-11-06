import { ChevronRight, Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, type Minor } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { changeLabel, type ChangeRequest } from "../domain/change-request";
import { ChangeStatusBadge } from "./change-status-badge";

/**
 * The project's change requests, newest first, with "New change request"
 * and the proposal's add-ons ready to turn into one.
 */
export function ChangeList({
  projectId,
  changes,
  currency,
  canCreate,
  addons,
  headingId,
}: {
  projectId: string;
  changes: ChangeRequest[];
  currency: CurrencyCode;
  /** Only once the proposal is approved. */
  canCreate: boolean;
  addons: { id: string; title: string; amount: Minor; unit: string | null }[];
  headingId: string;
}) {
  const base = `/projects/${projectId}/changes`;
  const money = (amount: Minor) => formatMoney(amount, currency);
  // Add-ons that haven't been turned into a change request yet (by name).
  const used = new Set(changes.map((c) => c.title.toLowerCase()));
  const open = addons.filter((a) => !used.has(a.title.toLowerCase()));

  return (
    <section aria-labelledby={headingId} className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-[15px] font-semibold">
          Change requests
        </h2>
        {canCreate && (
          <Button asChild size="sm">
            <Link href={`${base}/new` as Route}>
              <Plus aria-hidden />
              New change request
            </Link>
          </Button>
        )}
      </div>

      {changes.length === 0 ? (
        <div className="rounded-xl border border-dashed px-5 py-4 text-sm leading-relaxed text-pretty text-muted-foreground">
          {canCreate
            ? "Extra work your client asks for goes here, each with its own price. They approve it on the same link as the proposal before you start."
            : "Once your client approves the proposal, extra work they ask for goes here as priced change requests."}
        </div>
      ) : (
        <ol className="divide-y rounded-xl border bg-background">
          {changes.map((c) => (
            <li key={c.id}>
              <Link
                href={`${base}/${c.number}` as Route}
                className="grid grid-cols-[3.75rem_minmax(0,1fr)_auto_1rem] items-center gap-3 px-4 py-3 hover:bg-muted/40 sm:px-5"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {changeLabel(c.number)}
                </span>
                <span className="grid min-w-0 gap-1 sm:flex sm:items-center sm:gap-3">
                  <span className="truncate text-sm font-medium">
                    {c.title}
                  </span>
                  <ChangeStatusBadge
                    status={c.status}
                    className="justify-self-start"
                  />
                </span>
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    ["rejected", "withdrawn"].includes(c.status) &&
                      "text-muted-foreground line-through",
                  )}
                >
                  {money(c.total)}
                </span>
                <ChevronRight
                  aria-hidden
                  className="size-4 text-muted-foreground"
                />
              </Link>
            </li>
          ))}
        </ol>
      )}

      {canCreate && open.length > 0 && (
        <div className="grid gap-2 rounded-xl border bg-canvas p-4">
          <p className="text-sm font-medium">
            From your proposal&apos;s add-ons
          </p>
          <ul className="grid gap-1.5">
            {open.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm"
              >
                <span className="min-w-0">
                  {a.title}{" "}
                  <span className="text-muted-foreground tabular-nums">
                    {money(a.amount)}
                    {a.unit ? ` ${a.unit}` : ""}
                  </span>
                </span>
                <Link
                  href={
                    `${base}/new?addon=${encodeURIComponent(a.id)}` as Route
                  }
                  className="font-medium underline-offset-4 hover:underline"
                >
                  Turn into a change request
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
