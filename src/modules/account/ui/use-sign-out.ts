"use client";

import { useState } from "react";
import { authClient } from "@/shared/auth/client";
import { crossAuthBoundary } from "./cross-auth-boundary";

/**
 * Signs out, then loads /sign-in fresh (see crossAuthBoundary).
 * `pending` stays true until the page unloads.
 */
export function useSignOut() {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  /** `then`: where to go after (default: sign in). */
  async function signOut(then?: string) {
    setPending(true);
    setFailed(false);
    const { error } = await authClient.signOut();
    if (error) {
      setPending(false);
      setFailed(true);
      return;
    }
    crossAuthBoundary(then ?? "/sign-in");
  }

  return { signOut, pending, failed };
}
