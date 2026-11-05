"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/shared/auth/client";

/** Signs out, then lands on /sign-in. `pending` drives "Signing out…". */
export function useSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signOut() {
    setPending(true);
    setFailed(false);
    const { error } = await authClient.signOut();
    if (error) {
      setPending(false);
      setFailed(true);
      return;
    }
    router.replace("/sign-in");
    router.refresh();
  }

  return { signOut, pending, failed };
}
