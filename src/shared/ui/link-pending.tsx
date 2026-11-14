"use client";

import { ChevronRight, LoaderCircle } from "lucide-react";
import { useLinkStatus } from "next/link";
import { cn } from "@/shared/lib/utils";

/**
 * Feedback the moment a link is tapped, for slow connections where the next
 * page isn't prefetched yet. Must sit inside a <Link>. Appears only if the
 * navigation takes longer than a beat (CSS: .sl-pending-hint), so fast
 * pages don't flicker.
 */
export function LinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <LoaderCircle
      aria-hidden
      className={cn(
        "sl-pending-hint size-4 shrink-0 animate-spin text-muted-foreground",
        className,
      )}
    />
  );
}

/** A row's chevron that turns into a spinner while its page loads. */
export function LinkChevron({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return pending ? (
    <LinkPending className={className} />
  ) : (
    <ChevronRight
      aria-hidden
      className={cn("size-4 shrink-0 text-muted-foreground", className)}
    />
  );
}
