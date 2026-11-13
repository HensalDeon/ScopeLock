"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { IDLE, type FormState } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { ShareLink } from "@/shared/ui/share-link";
import { TOUCH } from "@/shared/ui/touch";
import { ROLE_LABELS, type InviteRole } from "../domain/team";
import { inviteMember } from "../server/actions";

/**
 * Invite by email, as a member (or an admin, for the owner), saying what
 * the chosen role can do. After sending: the link, to send on WhatsApp.
 */
export function InviteForm({ roles }: { roles: readonly InviteRole[] }) {
  const uid = useId();
  const [state, action, pending] = useActionState<
    FormState<"email" | "role">,
    FormData
  >(inviteMember, IDLE);
  const [role, setRole] = useState<InviteRole>("member");
  const form = useRef<HTMLFormElement>(null);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  useEffect(() => {
    if (state.status === "success") form.current?.reset();
  }, [state]);
  return (
    <div className="grid gap-4">
      <form
        ref={form}
        action={action}
        onReset={() => setRole("member")}
        noValidate
        className="grid gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <Field data-invalid={errors.email ? true : undefined}>
            <FieldLabel htmlFor={`${uid}-email`}>Their email</FieldLabel>
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
          {roles.length > 1 ? (
            <Field>
              <FieldLabel htmlFor={`${uid}-role`}>Role</FieldLabel>
              <NativeSelect
                id={`${uid}-role`}
                name="role"
                defaultValue="member"
                onChange={(e) => setRole(e.target.value as InviteRole)}
                className="w-full"
                aria-describedby={`${uid}-role-help`}
              >
                {roles.map((r) => (
                  <NativeSelectOption key={r} value={r}>
                    {ROLE_LABELS[r].title}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          ) : (
            <input type="hidden" name="role" value="member" />
          )}
        </div>
        <FieldDescription id={`${uid}-role-help`} className="-mt-2">
          {roles.length > 1
            ? `${ROLE_LABELS[role].title}: ${ROLE_LABELS[role].detail}`
            : `As a member: ${ROLE_LABELS.member.detail} Only the owner can invite admins.`}
        </FieldDescription>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" className={TOUCH} disabled={pending}>
            {pending ? "Sending invite…" : "Send invite"}
          </Button>
          {state.status === "error" && state.message && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}
        </div>
      </form>
      {state.status === "success" && (
        <div
          role="status"
          className="grid gap-2 rounded-lg border bg-canvas px-4 py-3"
        >
          <p className="text-sm text-pretty">{state.message}</p>
          {state.link && (
            <ShareLink
              url={state.link}
              phone={null}
              message="Here's your invite to join us on ScopeLock:"
              compact
              primary={false}
              copyLabel="Copy invite link"
              whatsappLabel="Send the invite on WhatsApp"
            />
          )}
        </div>
      )}
    </div>
  );
}
