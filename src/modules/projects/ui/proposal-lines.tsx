"use client";

import { FieldDescription } from "@/shared/ui/field";
import { Textarea } from "@/shared/ui/textarea";
import { SectionCard, type SectionKit } from "./proposal-kit";
import { PROPOSAL_SECTIONS } from "./proposal-value";

/** A one-per-line list: what you need from the client, exclusions, terms. */
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
  return (
    <SectionCard kit={kit} id={id}>
      <>
        <Textarea
          aria-label={PROPOSAL_SECTIONS.find((s) => s.id === id)?.label}
          rows={4}
          value={value[id]}
          onChange={(e) => set(id, e.target.value)}
          {...field(id)}
        />
        <FieldDescription>One per line. {hint}</FieldDescription>
        {err(id)}
      </>
    </SectionCard>
  );
}
