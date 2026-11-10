import { formatDateTime } from "@/shared/lib/dates";
import { formatINR, paise } from "@/shared/lib/money";

export type PriceEntry = {
  monthlyPrice: number;
  createdAt: Date;
  createdBy: string;
};

/**
 * Admin: every price a plan has had, newest first. Prices are only ever
 * added, so this is the record of what people were charged when.
 */
export function PriceHistory({ entries }: { entries: PriceEntry[] }) {
  if (entries.length === 0)
    return (
      <p className="text-sm text-pretty text-muted-foreground">
        The price hasn&apos;t changed yet. The first change records the starting
        price too, so you can see what it was.
      </p>
    );
  return (
    <ol className="divide-y rounded-lg border">
      {entries.map((e, i) => (
        <li
          key={e.createdAt.toISOString()}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 px-4 py-3"
        >
          <span className="text-sm text-muted-foreground">
            {i === 0
              ? `Current since ${formatDateTime(e.createdAt)}`
              : `Until ${formatDateTime(entries[i - 1]?.createdAt ?? e.createdAt)}`}
          </span>
          <span className="row-span-2 font-semibold tabular-nums">
            {formatINR(paise(e.monthlyPrice))}
          </span>
          <span className="truncate text-[12px] text-muted-foreground">
            {e.createdBy === "starting price" ? "Starting price" : e.createdBy}
          </span>
        </li>
      ))}
    </ol>
  );
}
