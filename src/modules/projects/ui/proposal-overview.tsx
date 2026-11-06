"use client";

import { FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { SectionCard, type SectionKit } from "./proposal-kit";
import { L } from "./proposal-value";

/** The overview paragraph and an optional highlighted note. */
export function OverviewSection({ kit }: { kit: SectionKit }) {
  const { uid, value, set, field, err } = kit;
  return (
    <SectionCard kit={kit} id="overview">
      <div className="grid gap-3">
        <Textarea
          aria-label="Overview"
          rows={5}
          placeholder="Thank you for the opportunity… Here's what I'll build and how we'll work."
          value={value.overview}
          maxLength={L.overview}
          onChange={(e) => set("overview", e.target.value)}
          {...field("overview")}
        />
        {err("overview")}
        <div className="grid gap-1.5">
          <FieldLabel htmlFor={`${uid}-callout`}>
            Highlighted note{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </FieldLabel>
          <Input
            id={`${uid}-callout`}
            placeholder="Designed from scratch, inspired by your reference site."
            value={value.callout}
            maxLength={L.callout}
            onChange={(e) => set("callout", e.target.value)}
            {...field("callout")}
          />
          {err("callout")}
        </div>
      </div>
    </SectionCard>
  );
}
