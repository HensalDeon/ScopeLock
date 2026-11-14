"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * A value to type into another app (UPI ID, account number, IFSC) with a
 * Copy button beside it, so nobody retypes 14 digits by hand.
 */
export function CopyValue({
  value,
  label,
  className,
}: {
  value: string;
  /** What it is, for the button's name ("Copy account number"). */
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <span className={cn("flex min-w-0 items-center gap-1", className)}>
      <span className="min-w-0 font-mono break-all">{value}</span>
      <button
        type="button"
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground max-sm:size-11 print:hidden"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
          } catch {
            // No clipboard (old browser): the value is selectable text.
          }
        }}
      >
        {copied ? (
          <Check aria-hidden className="size-4 text-success-ink" />
        ) : (
          <Copy aria-hidden className="size-4" />
        )}
      </button>
      <span role="status" className="sr-only">
        {copied ? `${label} copied` : ""}
      </span>
    </span>
  );
}
