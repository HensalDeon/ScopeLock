"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";

export type HighlightRow = { key: number; label: string; soon: boolean };

export const MAX_HIGHLIGHTS = 12;

/**
 * The lines the pricing page lists under a plan, in order. "Soon" adds the
 * small soon tag, for things the plan will include but aren't built yet.
 */
export function PlanHighlights({
  rows,
  onChange,
  errorFor,
  issueFor,
  nextKey,
}: {
  rows: HighlightRow[];
  onChange: (rows: HighlightRow[]) => void;
  errorFor: (index: number) => string | undefined;
  /** Where a line no longer matches the plan (doesn't block saving). */
  issueFor: (row: HighlightRow) => string | null;
  nextKey: () => number;
}) {
  const update = (key: number, patch: Partial<HighlightRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const move = (from: number, to: number) => {
    const next = [...rows];
    const [row] = next.splice(from, 1);
    if (row) next.splice(to, 0, row);
    onChange(next);
  };
  const icon = "size-11 text-muted-foreground sm:size-8";
  return (
    <div className="grid gap-3">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No lines yet. The pricing page shows the plan&apos;s name, summary and
          price on their own until you add one.
        </p>
      ) : (
        <ol className="grid gap-2">
          {rows.map((row, i) => {
            const error = errorFor(i);
            const issue = error ? null : issueFor(row);
            return (
              <li key={row.key} className="grid gap-1">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-1 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] sm:gap-x-2">
                  <Input
                    className="max-sm:col-span-full"
                    aria-label={`Line ${i + 1}`}
                    aria-invalid={Boolean(error) || undefined}
                    aria-describedby={
                      issue ? `line-issue-${row.key}` : undefined
                    }
                    value={row.label}
                    maxLength={80}
                    placeholder="Like “Your logo on approval pages”"
                    onChange={(e) => update(row.key, { label: e.target.value })}
                  />
                  <label className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground sm:min-h-9">
                    <Switch
                      size="sm"
                      aria-label={`Line ${i + 1}: mark as soon`}
                      checked={row.soon}
                      onCheckedChange={(soon) => update(row.key, { soon })}
                    />
                    <span aria-hidden>Soon</span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move line ${i + 1} up`}
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                    className={icon}
                  >
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move line ${i + 1} down`}
                    disabled={i === rows.length - 1}
                    onClick={() => move(i, i + 1)}
                    className={icon}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove line ${i + 1}`}
                    onClick={() =>
                      onChange(rows.filter((r) => r.key !== row.key))
                    }
                    className={icon}
                  >
                    <X aria-hidden />
                  </Button>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                {issue && (
                  <p
                    id={`line-issue-${row.key}`}
                    className="text-sm text-pretty text-warning-ink"
                  >
                    {issue}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={rows.length >= MAX_HIGHLIGHTS}
          onClick={() =>
            onChange([...rows, { key: nextKey(), label: "", soon: false }])
          }
        >
          <Plus aria-hidden />
          Add a line
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">
          {rows.length} of {MAX_HIGHLIGHTS}
        </span>
      </div>
    </div>
  );
}
