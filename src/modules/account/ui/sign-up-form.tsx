"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { authClient } from "@/shared/auth/client";
import { PASSWORD_MIN_LENGTH } from "@/shared/auth/policy";
import { safeNextPath } from "@/shared/auth/redirect";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/shared/ui/field";
import { TOUCH_LINK } from "@/shared/ui/touch";
import { FormAlert } from "@/shared/ui/form-alert";
import { Input } from "@/shared/ui/input";
import { authErrorMessage } from "../domain/auth-flow";
import { crossAuthBoundary } from "./cross-auth-boundary";
import { GoogleButton } from "./google-button";
import { PasswordInput } from "./password-input";

export function SignUpForm({
  googleEnabled,
  defaultEmail = "",
}: {
  googleEnabled: boolean;
  /** Typed on the landing page; the visitor can still change it. */
  defaultEmail?: string;
}) {
  // Unique per instance: visited pages stay mounted, so two copies of
  // this form can be in the document at once (CONVENTIONS §5).
  const uid = useId();
  // Set by a team invite (/invite/…): come back there, not to onboarding.
  const next = useSearchParams().get("next");
  const after = next ? safeNextPath(next) : null;
  const [error, setError] = useState<{
    message: string;
    exists: boolean;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"name" | "email" | "password", string>>
  >({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const name = String(form.get("name")).trim();
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    // Checked here, in the order of the fields, each under its own field.
    const errors: typeof fieldErrors = {};
    if (!name) errors.name = "Add your name, as your clients know you.";
    if (!email) errors.email = "Add your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "That doesn't look like an email address.";
    if (password.length < PASSWORD_MIN_LENGTH)
      errors.password = `Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`;
    setFieldErrors(errors);
    const first = (["name", "email", "password"] as const).find(
      (f) => errors[f],
    );
    if (first) {
      setError(null);
      formEl.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: after ?? "/dashboard",
    });

    if (error) {
      setError({
        message: authErrorMessage(error),
        exists: error.code?.startsWith("USER_ALREADY_EXISTS") ?? false,
      });
      setPending(false);
      return;
    }
    crossAuthBoundary(after ?? "/onboarding");
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
                  href={
                    after
                      ? `/sign-in?next=${encodeURIComponent(after)}`
                      : "/sign-in"
                  }
                  className="font-medium underline underline-offset-4"
                >
                  Go to sign in
                </Link>
              </>
            )}
          </FormAlert>
        )}

        <Field data-invalid={Boolean(fieldErrors.name) || undefined}>
          <FieldLabel htmlFor={`${uid}-name`}>Your name</FieldLabel>
          <Input
            id={`${uid}-name`}
            name="name"
            autoComplete="name"
            required
            autoFocus
            aria-invalid={Boolean(fieldErrors.name) || undefined}
          />
          <FieldError>{fieldErrors.name}</FieldError>
        </Field>

        <Field data-invalid={Boolean(fieldErrors.email) || undefined}>
          <FieldLabel htmlFor={`${uid}-email`}>Email</FieldLabel>
          <Input
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            defaultValue={defaultEmail}
            required
            aria-invalid={Boolean(fieldErrors.email) || undefined}
          />
          <FieldError>{fieldErrors.email}</FieldError>
        </Field>

        <Field data-invalid={Boolean(fieldErrors.password) || undefined}>
          <FieldLabel htmlFor={`${uid}-password`}>Password</FieldLabel>
          <PasswordInput
            id={`${uid}-password`}
            name="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
            aria-invalid={Boolean(fieldErrors.password) || undefined}
          />
          {fieldErrors.password ? (
            <FieldError>{fieldErrors.password}</FieldError>
          ) : (
            <FieldDescription>
              At least {PASSWORD_MIN_LENGTH} characters.
            </FieldDescription>
          )}
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
        <p className="-mt-2 text-[13px] text-muted-foreground">
          By creating an account you agree to the{" "}
          <Link
            href="/terms"
            className={`underline underline-offset-4 ${TOUCH_LINK}`}
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className={`underline underline-offset-4 ${TOUCH_LINK}`}
          >
            Privacy policy
          </Link>
          .
        </p>

        {googleEnabled && (
          <>
            <FieldSeparator>or</FieldSeparator>
            <GoogleButton
              callbackURL={after ?? "/dashboard"}
              label="Sign up with Google"
            />
          </>
        )}
      </FieldGroup>
    </form>
  );
}
