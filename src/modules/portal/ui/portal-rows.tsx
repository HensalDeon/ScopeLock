import { ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  CHANGE_STATUS_LABELS,
  changeLabel,
  type ChangeRequest,
} from "@/modules/changes";
import { CLIENT_PAYMENT_LABELS, type ScheduleItem } from "@/modules/payments";
import { cn } from "@/shared/lib/utils";

/** Rows of the client's project page: totals, change requests, payments. */

export function Row({
  label,
  strong,
  children,
}: {
  label: string;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4",
        strong && "border-t pt-2 text-[15px] font-semibold",
      )}
    >
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  );
}

export function ChangeRow({
  change,
  token,
  money,
}: {
  change: ChangeRequest;
  token: string;
  money: (amount: number) => string;
}) {
  // A change the freelancer took back reads as "being updated" to the client.
  const status =
    change.status === "draft"
      ? "Being updated"
      : CHANGE_STATUS_LABELS[change.status];
  return (
    <li>
      <Link
        href={`/c/${token}/changes/${change.number}`}
        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
      >
        <span className="w-14 shrink-0 font-mono text-[11px] tracking-[0.08em] text-muted-foreground">
          {changeLabel(change.number)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{change.title}</span>
          <span
            className={cn(
              "text-xs",
              change.status === "approved" && "text-brand-ink",
              change.status === "sent" && "text-warning-ink",
              !["approved", "sent"].includes(change.status) &&
                "text-muted-foreground",
            )}
          >
            {status}
          </span>
        </span>
        <span
          className={cn(
            "tabular-nums",
            ["rejected", "withdrawn"].includes(change.status) &&
              "text-muted-foreground line-through",
          )}
        >
          {money(change.total)}
        </span>
        <ChevronRight
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground"
        />
      </Link>
    </li>
  );
}

export function PaymentRow({
  item,
  token,
  money,
}: {
  item: ScheduleItem;
  token: string;
  money: (amount: number) => string;
}) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{item.label}</span>
        <span
          className={cn(
            "text-xs",
            item.state === "due" && "font-medium text-warning-ink",
            item.state === "client_reported" && "text-warning-ink",
            (item.state === "upcoming" || item.state === "received") &&
              "text-muted-foreground",
          )}
        >
          {CLIENT_PAYMENT_LABELS[item.state]}
        </span>
      </span>
      <span className="grid text-right tabular-nums">
        {money(item.payable)}
        {item.tax > 0 && (
          <span className="text-xs text-muted-foreground">incl. GST</span>
        )}
      </span>
      {item.payment ? (
        <span className="flex items-center gap-1 text-sm font-medium">
          {item.state === "due" ? "Pay" : "View"}
          <ChevronRight aria-hidden className="size-4" />
        </span>
      ) : (
        <span className="w-12" aria-hidden />
      )}
    </>
  );
  return (
    <li>
      {item.payment ? (
        <Link
          href={`/c/${token}/pay/${item.payment.id}`}
          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 text-sm">{body}</div>
      )}
    </li>
  );
}
