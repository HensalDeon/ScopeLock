"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { authClient } from "@/shared/auth/client";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { Input } from "@/shared/ui/input";
import { safeNextPath } from "@/shared/auth/redirect";
import { authErrorMessage } from "../domain/auth-flow";
import { crossAuthBoundary } from "./cross-auth-boundary";
import { GoogleButton } from "./google-button";
import { PasswordInput } from "./password-input";

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  // Unique per instance: visited pages stay mounted, so two copies of
  // this form can be in the document at once (CONVENTIONS §5).
  const uid = useId();
  const next = safeNextPath(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      callbackURL: next,
    });

    if (error) {
      setError(authErrorMessage(error));
      setPending(false);
      return;
    }
    crossAuthBoundary(next);
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

        <Field>
          <div className="flex items-baseline justify-between gap-3">
            <FieldLabel htmlFor={`${uid}-password`}>Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot it?
            </Link>
          </div>
          <PasswordInput
            id={`${uid}-password`}
            name="password"
            autoComplete="current-password"
            required
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        {googleEnabled && (
          <>
            <FieldSeparator>or</FieldSeparator>
            <GoogleButton callbackURL={next} />
          </>
        )}
      </FieldGroup>
    </form>
  );
}
