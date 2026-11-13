import type { CurrencyCode } from "@/shared/lib/currency";
import { formatDate } from "@/shared/lib/dates";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

const BADGE =
  "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap tabular-nums";
const WAITING = "border-warning/25 bg-warning-soft text-warning-ink";
const IDLE = "border-border bg-muted text-muted-foreground";

/**
 * Whether money still to come has been asked for: a waiting badge with the
 * date it was asked (amber: it's with the client), and an idle one for what
 * isn't asked for yet. The same badges wherever "asked for" appears.
 */
export function AskBadges({
  asked,
  notAsked,
  askedAt,
  currency,
  now,
  className,
}: {
  asked: number;
  notAsked: number;
  askedAt: Date | null;
  currency: CurrencyCode;
  now: Date;
  className?: string;
}) {
  const both = asked > 0 && notAsked > 0;
  const money = (n: number) =>
    formatMoney(n as Parameters<typeof formatMoney>[0], currency);
  return (
    <span className={cn("flex flex-wrap gap-1.5", className)}>
      {asked > 0 && (
        <span className={cn(BADGE, WAITING)}>
          <span aria-hidden className="size-1.5 rounded-full bg-warning" />
          {both ? `${money(asked)} asked` : "Asked"}
          {askedAt ? ` ${formatDate(askedAt, { now })}` : ""}
        </span>
      )}
      {notAsked > 0 && (
        <span className={cn(BADGE, IDLE)}>
          {both ? `${money(notAsked)} not asked yet` : "Not asked yet"}
        </span>
      )}
    </span>
  );
}
