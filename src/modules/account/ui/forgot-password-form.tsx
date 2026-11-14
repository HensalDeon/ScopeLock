"use client";

import { useId, useState } from "react";
import { authClient } from "@/shared/auth/client";
import {
  CODE_TTL_MINUTES,
  isCompleteCode,
  PASSWORD_MIN_LENGTH,
} from "@/shared/auth/policy";
import { Button } from "@/shared/ui/button";
import { CodeInput } from "@/shared/ui/code-input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { Input } from "@/shared/ui/input";
import { authErrorMessage } from "../domain/auth-flow";
import { crossAuthBoundary } from "./cross-auth-boundary";
import { PasswordInput } from "./password-input";
import { useResendTimer } from "./use-resend-timer";
import { TOUCH_LINK } from "@/shared/ui/touch";
import { AuthHeading } from "./auth-heading";

/**
 * Two steps on one page: email → code + new password. On success the person
 * is signed in and taken to the dashboard; other devices are signed out.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState<string | null>(null);

  // Each step has its own heading, so step 2 never reads as step 1.
  return email ? (
    <>
      <AuthHeading title="Check your email" />
      <CodeStep email={email} onChangeEmail={() => setEmail(null)} />
    </>
  ) : (
    <>
      <AuthHeading
        title="Reset your password"
        description="Enter the email you signed up with. We'll send a 6‑digit code so you can choose a new password."
      />
      <EmailStep onSent={setEmail} />
    </>
  );
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  // Unique per instance: visited pages stay mounted, so two copies of
  // this form can be in the document at once (CONVENTIONS §5).
  const uid = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    if (!email.includes("@")) {
      setError("Enter the email you signed up with.");
      return;
    }
    setPending(true);
    setError(null);
    const { error } = await authClient.emailOtp.requestPasswordReset({
      email,
    });
    setPending(false);
    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    onSent(email);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        {error && <FormAlert>{error}</FormAlert>}
        <Field>
          <FieldLabel htmlFor={`${uid}-email`}>Email</FieldLabel>
          <Input
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            autoFocus
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send code"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function CodeStep({
  email,
  onChangeEmail,
}: {
  email: string;
  onChangeEmail: () => void;
}) {
  // Unique per instance: visited pages stay mounted, so two copies of
  // this form can be in the document at once (CONVENTIONS §5).
  const uid = useId();
  const timer = useResendTimer(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const otp = String(form.get("code"));
    const password = String(form.get("password"));
    if (!isCompleteCode(otp)) {
      setError("Enter the 6‑digit code from the email.");
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(
        `Use at least ${PASSWORD_MIN_LENGTH} characters for your new password.`,
      );
      return;
    }

    setPending(true);
    setError(null);
    setNotice(null);
    const { error } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password,
    });
    if (error) {
      setPending(false);
      setError(authErrorMessage(error));
      return;
    }

    // Password saved. Sign straight in rather than sending them back to a form.
    const signIn = await authClient.signIn.email({ email, password });
    if (signIn.error) {
      crossAuthBoundary("/sign-in");
      return;
    }
    crossAuthBoundary("/dashboard");
  }

  async function resend() {
    setResending(true);
    setError(null);
    const { error } = await authClient.emailOtp.requestPasswordReset({
      email,
    });
    setResending(false);
    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    timer.start();
    setNotice("New code sent. Use the latest email; older codes stop working.");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          If <strong className="font-medium text-foreground">{email}</strong>{" "}
          has a ScopeLock account, we&apos;ve sent it a 6‑digit code. It works
          for {CODE_TTL_MINUTES} minutes. Check spam if it isn&apos;t there in a
          minute.
        </p>
        {error && <FormAlert>{error}</FormAlert>}
        {notice && !error && <FormAlert tone="success">{notice}</FormAlert>}
        <Field>
          <FieldLabel htmlFor={`${uid}-code`}>Code from the email</FieldLabel>
          <CodeInput id={`${uid}-code`} name="code" required autoFocus />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${uid}-password`}>New password</FieldLabel>
          <PasswordInput
            id={`${uid}-password`}
            name="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
          />
          <FieldDescription>
            At least {PASSWORD_MIN_LENGTH} characters. You&apos;ll be signed out
            on other devices.
          </FieldDescription>
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save password and sign in"}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
          <button
            type="button"
            onClick={resend}
            disabled={resending || timer.secondsLeft > 0}
            className={`text-muted-foreground tabular-nums underline-offset-4 hover:text-foreground hover:underline disabled:pointer-events-none ${TOUCH_LINK}`}
          >
            {resending
              ? "Sending…"
              : timer.secondsLeft > 0
                ? `Send a new code in ${timer.secondsLeft}s`
                : "Send a new code"}
          </button>
          <button
            type="button"
            onClick={onChangeEmail}
            className={`text-muted-foreground underline-offset-4 hover:text-foreground hover:underline ${TOUCH_LINK}`}
          >
            Use a different email
          </button>
        </div>
      </FieldGroup>
    </form>
  );
}
