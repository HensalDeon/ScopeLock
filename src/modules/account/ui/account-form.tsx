"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { authClient } from "@/shared/auth/client";
import { Button } from "@/shared/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { Input } from "@/shared/ui/input";
import { authErrorMessage } from "../domain/auth-flow";

export function AccountNameForm({ name }: { name: string }) {
  // Unique per instance: visited pages stay mounted, so two copies of
  // this form can be in the document at once (CONVENTIONS §5).
  const uid = useId();
  const router = useRouter();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "saved" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("name")).trim();
    if (value.length < 2) {
      setStatus({ kind: "error", message: "Enter at least 2 characters." });
      return;
    }
    setPending(true);
    const { error } = await authClient.updateUser({ name: value });
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
        <Field>
          <FieldLabel htmlFor={`${uid}-account-name`}>Your name</FieldLabel>
          <Input
            id={`${uid}-account-name`}
            name="name"
            defaultValue={name}
            autoComplete="name"
            maxLength={80}
            onChange={() => setStatus({ kind: "idle" })}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Saving…" : "Update name"}
          </Button>
          {status.kind === "saved" && (
            <p role="status" className="text-sm text-muted-foreground">
              Name updated.
            </p>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
