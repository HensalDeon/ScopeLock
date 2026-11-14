"use client";

import { WifiOff } from "lucide-react";
import { useOffline } from "./connection";

/** Inside the app: says plainly when nothing can be saved. */
export function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex items-center gap-2 border-b bg-warning-soft px-4 py-2 text-sm text-warning-ink print:hidden"
    >
      <WifiOff aria-hidden className="size-4 shrink-0" />
      <span className="text-pretty">
        You&apos;re offline. Nothing you change will save until you&apos;re back
        online.
      </span>
    </div>
  );
}
