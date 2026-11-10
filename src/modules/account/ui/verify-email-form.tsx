"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/shared/auth/client";
import { isCompleteCode } from "@/shared/auth/policy";
import { Button } from "@/shared/ui/button";
import { CodeInput } from "@/shared/ui/code-input";
import { authErrorMessage } from "../domain/auth-flow";
import { useResendTimer } from "./use-resend-timer";

/**
 * Inline "enter the code" form for the confirm-your-email bar. Submits by
 * itself once six digits are in (typed, pasted or autofilled).
 */
export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const timer = useResendTimer();
  const [message, setMessage] = useState<{
    tone: "error" | "info";
    text: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [done, setDone] = useState(false);

  async function verify(otp: string) {
    if (pending) return;
    if (!isCompleteCode(otp)) {
      setMessage({ tone: "error", text: "Enter the 6-digit code." });
      return;
    }
    setPending(true);
    setMessage(null);
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp });
    if (error) {
      setPending(false);
      setMessage({ tone: "error", text: authErrorMessage(error) });
      return;
    }
    setDone(true);
    router.refresh();
  }

  async function resend() {
    setResending(true);
    setMessage(null);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    setResending(false);
    if (error) {
      setMessage({ tone: "error", text: authErrorMessage(error) });
      return;
    }
    timer.start();
    setMessage({ tone: "info", text: `New code sent to ${email}.` });
  }

  if (done) {
    return (
      <p role="status" className="text-sm font-medium">
        Email confirmed.
      </p>
    );
  }

  return (
    <div className="grid gap-1.5">
      <form
        noValidate
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void verify(String(new FormData(event.currentTarget).get("code")));
        }}
      >
        <CodeInput
          name="code"
          aria-label="6-digit code"
          placeholder="······"
          aria-invalid={message?.tone === "error" || undefined}
          className="h-9 w-[9.5rem] px-2.5 text-[17px] tracking-[0.36em]"
          onValueChange={(code) => {
            if (isCompleteCode(code)) void verify(code);
          }}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={pending}
          className="h-9"
        >
          {pending ? "Checking…" : "Confirm"}
        </Button>
        <button
          type="button"
          onClick={resend}
          disabled={resending || timer.secondsLeft > 0}
          className="px-1 text-sm font-medium tabular-nums underline underline-offset-4 hover:no-underline disabled:no-underline disabled:opacity-70"
        >
          {resending
            ? "Sending…"
            : timer.secondsLeft > 0
              ? `New code in ${timer.secondsLeft}s`
              : "Send a new code"}
        </button>
      </form>
      {message && (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={
            message.tone === "error" ? "text-sm text-destructive" : "text-sm"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
