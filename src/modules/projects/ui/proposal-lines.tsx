"use client";

import { useState } from "react";
import { splitLines } from "@/shared/lib/text-lines";
import { cn } from "@/shared/lib/utils";
import { FieldDescription } from "@/shared/ui/field";
import { Textarea } from "@/shared/ui/textarea";
import { SectionCard, type SectionKit } from "./proposal-kit";
import { PROPOSAL_SECTIONS } from "./proposal-value";

/**
 * A one-per-line list: what you need from the client, exclusions, terms.
 * On phones it starts folded to "4 points · Edit" (the form is long there);
 * wider screens always show the text.
 */
export function LinesSection({
  kit,
  id,
  hint,
}: {
  kit: SectionKit;
  id: "clientProvides" | "exclusions" | "terms";
  hint: string;
}) {
  const { value, set, field, err } = kit;
  const [open, setOpen] = useState(false);
  const error = err(id);
  const count = splitLines(value[id]).length;
  const shown = open || Boolean(error);
  return (
    <SectionCard kit={kit} id={id}>
      <>
        {!shown && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-11 items-center justify-between rounded-md border px-3 text-left text-sm sm:hidden"
          >
            <span className="text-muted-foreground">
              {count === 0
                ? "Nothing yet"
                : `${count} ${count === 1 ? "point" : "points"}`}
            </span>
            <span className="font-medium">Edit</span>
          </button>
        )}
        <div className={cn("grid gap-2", !shown && "max-sm:hidden")}>
          <Textarea
            aria-label={PROPOSAL_SECTIONS.find((s) => s.id === id)?.label}
            rows={4}
            value={value[id]}
            onChange={(e) => set(id, e.target.value)}
            {...field(id)}
          />
          <FieldDescription>One per line. {hint}</FieldDescription>
          {error}
        </div>
      </>
    </SectionCard>
  );
}
