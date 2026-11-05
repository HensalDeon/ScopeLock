"use client";

import { useState, useTransition } from "react";
import { clientInputSchema, quickAddClient } from "@/modules/clients";
import { IDLE, type FormState } from "@/shared/lib/form-state";
import { useFormValidation } from "@/shared/lib/use-form-validation";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { ClientOption } from "./project-form";

type Field = "name" | "company" | "phone";

/**
 * Add a client without leaving the project form. Not a nested <form> (HTML
 * doesn't allow one): it builds FormData and calls the server action itself.
 * Checked live with the same rules as the full client form.
 */
export function QuickAddClient({
  onAdded,
  onCancel,
}: {
  onAdded: (client: ClientOption) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<Record<Field, string>>({
    name: "",
    company: "",
    phone: "",
  });
  const [serverState, setServerState] = useState<FormState<string>>(IDLE);
  const [pending, startTransition] = useTransition();
  const form = useFormValidation(
    clientInputSchema,
    { ...values, email: "" },
    { serverState },
  );

  function add() {
    if (!form.markSubmitted()) return;
    startTransition(async () => {
      const data = new FormData();
      data.set("name", values.name);
      data.set("company", values.company);
      data.set("phone", values.phone);
      data.set("email", "");
      const result = await quickAddClient(IDLE, data);
      setServerState(result);
      if (result.status === "success" && result.id) {
        onAdded({ id: result.id, label: result.message ?? values.name });
      }
    });
  }

  const input = (name: Field) => ({
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      form.edited(name);
    },
    onBlur: () => form.touch(name),
    // Enter here would submit the whole project form.
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        add();
      }
    },
    "aria-invalid": Boolean(form.errorFor(name)) || undefined,
    className: "h-9 bg-background",
  });

  const error = (name: Field) =>
    form.errorFor(name) && (
      <p className="text-sm text-destructive">{form.errorFor(name)}</p>
    );

  return (
    <div className="mt-1 grid gap-3 rounded-lg border bg-canvas p-4">
      <p className="text-sm font-medium">New client</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Input
            aria-label="Client name"
            placeholder="Rahul Mehta"
            {...input("name")}
          />
          {error("name")}
        </div>
        <div className="grid gap-1.5">
          <Input
            aria-label="Company (optional)"
            placeholder="Company (optional)"
            {...input("company")}
          />
          {error("company")}
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Input
            aria-label="WhatsApp number (optional)"
            placeholder="WhatsApp number (optional)"
            type="tel"
            inputMode="tel"
            {...input("phone")}
          />
          {error("phone")}
        </div>
      </div>
      {serverState.status === "error" && serverState.message && (
        <p role="alert" className="text-sm text-destructive">
          {serverState.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={add} disabled={pending}>
          {pending ? "Adding client…" : "Add client"}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
