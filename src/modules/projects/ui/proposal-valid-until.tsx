"use client";

import { FieldDescription } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { SectionCard, type SectionKit } from "./proposal-kit";

/** The last day the prices hold. */
export function ValidUntilSection({ kit }: { kit: SectionKit }) {
  const { value, set, field, err } = kit;
  return (
    <SectionCard kit={kit} id="validUntil">
      <div className="grid gap-1.5">
        <Input
          aria-label="Valid until"
          type="date"
          value={value.validUntil}
          onChange={(e) => set("validUntil", e.target.value)}
          {...field("validUntil")}
          className="w-fit"
        />
        <FieldDescription>The last day your prices hold.</FieldDescription>
        {err("validUntil")}
      </div>
    </SectionCard>
  );
}
