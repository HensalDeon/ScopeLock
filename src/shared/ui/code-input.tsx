"use client";

import * as React from "react";
import { CODE_LENGTH, normalizeCode } from "@/shared/auth/codes";
import { cn } from "@/shared/lib/utils";

/**
 * One box for a 6-digit email code. A single field (not six) so paste,
 * iOS/Android "From Mail" autofill and screen readers all just work.
 * Non-digits are dropped as you type or paste.
 */
export function CodeInput({
  className,
  onValueChange,
  ...props
}: Omit<
  React.ComponentProps<"input">,
  "type" | "inputMode" | "maxLength" | "onChange"
> & {
  onValueChange?: (code: string) => void;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={CODE_LENGTH + 4}
      spellCheck={false}
      data-slot="input"
      onChange={(event) => {
        const code = normalizeCode(event.currentTarget.value);
        event.currentTarget.value = code;
        onValueChange?.(code);
      }}
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 font-mono text-[22px] tracking-[0.42em] tabular-nums transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}
