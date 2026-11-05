"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { z } from "zod";
import { authClient } from "@/shared/auth/client";
import { useFormValidation } from "@/shared/lib/use-form-validation";
import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { Input } from "@/shared/ui/input";
import { authErrorMessage } from "../domain/auth-flow";

const NAME_MAX_LENGTH = 80;
const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(NAME_MAX_LENGTH, `Keep it under ${NAME_MAX_LENGTH} characters.`),
});

/** Settings: the account holder's own name. Saves only when it changed. */
export function AccountNameForm({ name }: { name: string }) {
  // Unique per instance: visited pages stay mounted, so two copies of
  // this form can be in the document at once (CONVENTIONS §5).
  const uid = useId();
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "saved" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [pending, setPending] = useState(false);
  const form = useFormValidation(
    nameSchema,
    { name: value },
    { initial: { name } },
  );
  const error = form.errorFor("name");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.markSubmitted()) return;
    setPending(true);
    const { error } = await authClient.updateUser({ name: value.trim() });
    setPending(false);
    if (error) {
      setStatus({ kind: "error", message: authErrorMessage(error) });
      return;
    }
    setStatus({ kind: "saved" });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        {status.kind === "error" && <FormAlert>{status.message}</FormAlert>}
        <Field data-invalid={Boolean(error) || undefined}>
          <FieldLabel htmlFor={`${uid}-account-name`}>Your name</FieldLabel>
          <Input
            id={`${uid}-account-name`}
            name="name"
            value={value}
            autoComplete="name"
            maxLength={NAME_MAX_LENGTH}
            aria-invalid={Boolean(error) || undefined}
            onChange={(e) => {
              setValue(e.target.value);
              setStatus({ kind: "idle" });
            }}
            onBlur={() => form.touch("name")}
          />
          {error && <FieldError>{error}</FieldError>}
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="outline"
            disabled={pending || !form.isDirty}
          >
            {pending ? "Saving…" : "Update name"}
          </Button>
          {status.kind === "saved" && !form.isDirty && (
            <p role="status" className="text-sm text-muted-foreground">
              Name updated.
            </p>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
