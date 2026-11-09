"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { authClient } from "@/shared/auth/client";
import { PASSWORD_MIN_LENGTH } from "@/shared/auth/policy";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { Input } from "@/shared/ui/input";
import { authErrorMessage } from "../domain/auth-flow";
import { crossAuthBoundary } from "./cross-auth-boundary";
import { GoogleButton } from "./google-button";
import { PasswordInput } from "./password-input";

export function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  // Unique per instance: visited pages stay mounted, so two copies of
  // this form can be in the document at once (CONVENTIONS §5).
  const uid = useId();
  const [error, setError] = useState<{
    message: string;
    exists: boolean;
  } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError({
        message: `Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`,
        exists: false,
      });
      return;
    }

    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")).trim(),
      email: String(form.get("email")).trim(),
      password,
      callbackURL: "/dashboard",
    });

    if (error) {
      setError({
        message: authErrorMessage(error),
        exists: error.code?.startsWith("USER_ALREADY_EXISTS") ?? false,
      });
      setPending(false);
      return;
    }
    crossAuthBoundary("/onboarding");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        {error && (
          <FormAlert>
            {error.message}
            {error.exists && (
              <>
                {" "}
                <Link
                  href="/sign-in"
                  className="font-medium underline underline-offset-4"
                >
                  Go to sign in
                </Link>
              </>
            )}
          </FormAlert>
        )}

        <Field>
          <FieldLabel htmlFor={`${uid}-name`}>Your name</FieldLabel>
          <Input
            id={`${uid}-name`}
            name="name"
            autoComplete="name"
            required
            autoFocus
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${uid}-email`}>Email</FieldLabel>
          <Input
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${uid}-password`}>Password</FieldLabel>
          <PasswordInput
            id={`${uid}-password`}
            name="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
          />
          <FieldDescription>
            At least {PASSWORD_MIN_LENGTH} characters.
          </FieldDescription>
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
        <p className="-mt-2 text-[13px] text-muted-foreground">
          By creating an account you agree to the{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy policy
          </Link>
          .
        </p>

        {googleEnabled && (
          <>
            <FieldSeparator>or</FieldSeparator>
            <GoogleButton
              callbackURL="/dashboard"
              label="Sign up with Google"
            />
          </>
        )}
      </FieldGroup>
    </form>
  );
}
