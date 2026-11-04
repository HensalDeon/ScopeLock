"use client";

import { useState } from "react";
import { authClient } from "@/shared/auth/client";

export function ResendVerificationButton({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  if (state === "sent") {
    return <span className="font-medium">Sent. Check your inbox.</span>;
  }

  return (
    <button
      type="button"
      disabled={state === "sending"}
      className="font-medium underline underline-offset-4 hover:no-underline disabled:opacity-60"
      onClick={async () => {
        setState("sending");
        const { error } = await authClient.sendVerificationEmail({
          email,
          callbackURL: "/dashboard",
        });
        setState(error ? "error" : "sent");
      }}
    >
      {state === "sending"
        ? "Sending…"
        : state === "error"
          ? "Couldn't send. Try again"
          : "Send it again"}
    </button>
  );
}
