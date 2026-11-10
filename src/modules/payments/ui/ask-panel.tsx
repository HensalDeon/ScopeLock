"use client";

import type { Route } from "next";
import Link from "next/link";
import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { INLINE_PANEL_FOCUS } from "@/shared/ui/use-inline-panel";
import { requestPayment } from "../server/actions";
import { Run } from "./run-action";

/**
 * "Ask Rahul for ₹28,320?": what asking does (an invoice, a pay page, an
 * email), the GST it carries, and anything to fix first. Asking for a
 * client abroad with only UPI set up is blocked until a bank or link exists.
 */
export function AskPanel({
  panelProps,
  clientFirstName,
  clientEmail,
  amount,
  breakdown,
  stateFallback,
  exportCheck,
  abroadNeedsBankOrLink,
  projectId,
  itemKey,
  onClose,
}: {
  panelProps: HTMLAttributes<HTMLDivElement>;
  clientFirstName: string;
  clientEmail: string | null;
  amount: string;
  breakdown?: string;
  stateFallback?: { yourState: string; clientHref: string } | null;
  exportCheck: { clientHref: string } | null;
  abroadNeedsBankOrLink: boolean;
  projectId: string;
  itemKey: string;
  onClose: () => void;
}) {
  return (
    <div
      {...panelProps}
      className={cn(
        "grid gap-2 rounded-lg border bg-background p-3",
        INLINE_PANEL_FOCUS,
      )}
    >
      <div className="grid gap-1">
        <p className="text-sm font-medium">
          Ask {clientFirstName} for{" "}
          <span className="tabular-nums">{amount}</span>?
        </p>
        {breakdown && (
          <p className="text-sm text-muted-foreground tabular-nums">
            {breakdown}
          </p>
        )}
        <p className="text-sm text-pretty text-muted-foreground">
          {`This issues a numbered invoice and a pay page on ${clientFirstName}'s link. `}
          {clientEmail
            ? `${clientFirstName} also gets it by email at ${clientEmail}.`
            : `There's no email for ${clientFirstName}, so send the link on WhatsApp.`}
        </p>
      </div>
      {stateFallback && (
        <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-pretty text-warning-ink">
          {clientFirstName}&apos;s state isn&apos;t set, so this invoice uses
          yours ({stateFallback.yourState}) and charges CGST + SGST. If
          they&apos;re in another state,{" "}
          <Link
            href={stateFallback.clientHref as Route}
            className="font-medium underline underline-offset-4"
          >
            add their state or GSTIN
          </Link>{" "}
          first.
        </p>
      )}
      {exportCheck && (
        <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-pretty text-warning-ink">
          {clientFirstName} is outside India, so this invoice has no GST (export
          under your LUT). GST law counts it as an export only if you&apos;re
          paid in foreign currency, or in rupees through a bank route the RBI
          allows. A rupee UPI payment from them may not qualify, so check how
          they&apos;ll pay before relying on it.
        </p>
      )}
      {abroadNeedsBankOrLink && (
        <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-pretty text-warning-ink">
          {clientFirstName} is outside India, where UPI doesn&apos;t work. Add a
          bank account (with its SWIFT code) or a payment link first.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {abroadNeedsBankOrLink ? (
          <Button asChild size="sm" className={TOUCH}>
            <Link href="/settings/payments">Add bank details</Link>
          </Button>
        ) : (
          <Run
            action={requestPayment}
            fields={{ projectId, key: itemKey }}
            label={`Ask for ${amount}`}
            pendingLabel="Asking…"
          />
        )}
        <Button
          type="button"
          size="sm"
          className={TOUCH}
          variant="ghost"
          onClick={onClose}
        >
          Not yet
        </Button>
      </div>
    </div>
  );
}
