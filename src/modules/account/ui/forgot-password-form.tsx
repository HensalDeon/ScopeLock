"use client";

import { useState } from "react";
import { authClient } from "@/shared/auth/client";
import { Button } from "@/shared/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { Input } from "@/shared/ui/input";
import { authErrorMessage } from "../domain/auth-flow";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setPending(true);
    setError(null);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setPending(false);

    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <FormAlert tone="success">
        If there&apos;s an account for <strong>{sentTo}</strong>, a reset link
        is on its way. It works for 1 hour. Check spam if you don&apos;t see it
        in a minute or two.
      </FormAlert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        {error && <FormAlert>{error}</FormAlert>}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            autoFocus
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </FieldGroup>
    </form>
  );
}
