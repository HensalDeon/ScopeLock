"use client";

import { useEffect, useState } from "react";
import { CODE_RESEND_SECONDS } from "@/shared/auth/policy";

/**
 * Seconds left before another code can be requested. Call `start()` after
 * each send. Keeps people well under the server's per-minute send limit.
 */
export function useResendTimer(startRunning = false) {
  const [left, setLeft] = useState(startRunning ? CODE_RESEND_SECONDS : 0);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  return { secondsLeft: left, start: () => setLeft(CODE_RESEND_SECONDS) };
}
