"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { IDLE, type FormState } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { TOUCH } from "@/shared/ui/touch";
import { ROLE_LABELS, type InviteRole } from "../domain/team";
import { inviteMember } from "../server/actions";

/** Invite by email, as a member (or an admin, for the owner). */
export function InviteForm({ roles }: { roles: readonly InviteRole[] }) {
  const uid = useId();
  const [state, action, pending] = useActionState<
    FormState<"email" | "role">,
    FormData
  >(inviteMember, IDLE);
  const form = useRef<HTMLFormElement>(null);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  useEffect(() => {
    if (state.status === "success") form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={action} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor={`${uid}-email`}>Email</FieldLabel>
          <Input
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="off"
            placeholder="e.g. priya@ashadesigns.in"
            defaultValue={
              state.status === "error" ? (state.values?.email ?? "") : ""
            }
            aria-invalid={errors.email ? true : undefined}
          />
          <FieldError>{errors.email}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${uid}-role`}>As</FieldLabel>
          <NativeSelect
            id={`${uid}-role`}
            name="role"
            defaultValue="member"
            className="w-full"
          >
            {roles.map((r) => (
              <NativeSelectOption key={r} value={r}>
                {ROLE_LABELS[r].title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className={TOUCH} disabled={pending}>
          {pending ? "Sending invite…" : "Send invite"}
        </Button>
        {state.status !== "idle" && state.message && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={
              state.status === "error"
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
