"use client";

import { Plus, X } from "lucide-react";
import type { CurrencyCode } from "@/shared/lib/currency";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  PROPOSAL_SECTIONS,
  type ProposalFormValue,
  type ProposalSectionId,
} from "./proposal-value";

/** What every section editor needs from the proposal form. */
export type SectionKit = {
  /** Unique per form instance (visited pages stay mounted). */
  uid: string;
  value: ProposalFormValue;
  currency: CurrencyCode;
  set: <K extends keyof ProposalFormValue>(
    key: K,
    next: ProposalFormValue[K],
  ) => void;
  /** onBlur + aria-invalid for a field under "proposal.". */
  field: (
    path: string,
    touchKey?: string,
  ) => { onBlur: () => void; "aria-invalid": true | undefined };
  /** The field's error message as a paragraph, or null. */
  err: (path: string, touchKey?: string) => React.ReactNode;
  remove: (id: ProposalSectionId) => void;
};

/** A section's box: its name, a Remove button, then its fields. */
export function SectionCard({
  kit,
  id,
  children,
}: {
  kit: SectionKit;
  id: ProposalSectionId;
  children: React.ReactNode;
}) {
  const label = PROPOSAL_SECTIONS.find((s) => s.id === id)?.label;
  return (
    <div
      id={`${kit.uid}-section-${id}`}
      className="grid scroll-mt-24 gap-3 rounded-lg border bg-background p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => kit.remove(id)}
        >
          Remove
        </Button>
      </div>
      {children}
    </div>
  );
}

export function AddButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-fit"
      disabled={disabled}
      onClick={onClick}
    >
      <Plus aria-hidden />
      {children}
    </Button>
  );
}

export function RemoveButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className={cn("size-9 text-muted-foreground", className)}
    >
      <X aria-hidden />
    </Button>
  );
}
