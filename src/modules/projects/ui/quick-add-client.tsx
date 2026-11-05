"use client";

import { useState, useTransition } from "react";
import { quickAddClient } from "@/modules/clients";
import { IDLE, type FieldErrors } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { ClientOption } from "./project-form";

/**
 * Add a client without leaving the project form. Not a nested <form> (HTML
 * doesn't allow one): it builds FormData and calls the server action itself.
 */
export function QuickAddClient({
  onAdded,
  onCancel,
}: {
  onAdded: (client: ClientOption) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      const data = new FormData();
      data.set("name", name);
      data.set("company", company);
      data.set("phone", phone);
      data.set("email", "");
      const result = await quickAddClient(IDLE, data);
      if (result.status === "success" && result.id) {
        onAdded({ id: result.id, label: result.message ?? name });
        return;
      }
      if (result.status === "error") {
        setErrors(result.fieldErrors ?? {});
        setMessage(result.message ?? null);
      }
    });
  }

  // Enter inside these inputs would submit the whole project form.
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      add();
    }
  };

  return (
    <div className="mt-1 grid gap-3 rounded-lg border bg-canvas p-4">
      <p className="text-sm font-medium">New client</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Input
            aria-label="Client name"
            placeholder="Rahul Mehta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onKeyDown}
            aria-invalid={Boolean(errors.name) || undefined}
            className="h-9 bg-background"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Input
            aria-label="Company (optional)"
            placeholder="Company (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            onKeyDown={onKeyDown}
            className="h-9 bg-background"
          />
          {errors.company && (
            <p className="text-sm text-destructive">{errors.company}</p>
          )}
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Input
            aria-label="WhatsApp number (optional)"
            placeholder="WhatsApp number (optional)"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={onKeyDown}
            aria-invalid={Boolean(errors.phone) || undefined}
            className="h-9 bg-background"
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
        </div>
      </div>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
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
