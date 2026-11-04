"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/shared/auth/client";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { authErrorMessage } from "../domain/auth-flow";
import { PasswordInput } from "./password-input";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  if (!token || linkError) {
    return (
      <FormAlert>
        This reset link has expired or was already used.{" "}
        <Link
          href="/forgot-password"
          className="font-medium underline underline-offset-4"
        >
          Get a new link
        </Link>
      </FormAlert>
    );
  }

  if (done) {
    return (
      <div className="grid gap-5">
        <FormAlert tone="success">
          Password changed. You&apos;ve been signed out on other devices.
        </FormAlert>
        <Button asChild size="lg" className="w-full">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (password !== String(form.get("confirm"))) {
      setError("The two passwords don't match.");
      return;
    }

    setPending(true);
    setError(null);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    });
    setPending(false);
    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        {error && <FormAlert>{error}</FormAlert>}
        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
            autoFocus
          />
          <FieldDescription>At least 8 characters.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">Type it again</FieldLabel>
          <PasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            required
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save new password"}
        </Button>
      </FieldGroup>
    </form>
  );
}
