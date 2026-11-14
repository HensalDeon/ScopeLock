"use client";

import { createContext, useState } from "react";
import { cn } from "@/shared/lib/utils";

export type Payer = { name: string; email: string; contact: string | null };

/** One payment at a time: while a plan's Checkout is open, the rest wait. */
export const Busy = createContext<{
  busy: boolean;
  setBusy: (busy: boolean) => void;
}>({ busy: false, setBusy: () => {} });

export function CheckoutLock({ children }: { children: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  return <Busy value={{ busy, setBusy }}>{children}</Busy>;
}

export function Note({
  ok,
  children,
}: {
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      role={ok ? "status" : "alert"}
      className={cn(
        "col-span-full text-sm text-pretty",
        ok ? "text-muted-foreground" : "text-destructive",
      )}
    >
      {children}
    </div>
  );
}
