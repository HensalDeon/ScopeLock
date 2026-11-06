"use client";

import { FieldDescription, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { SectionCard, type SectionKit } from "./proposal-kit";
import { L } from "./proposal-value";

/** Title and subtitle on the cover. */
export function HeadingSection({ kit }: { kit: SectionKit }) {
  const { uid, value, set, field, err } = kit;
  return (
    <SectionCard kit={kit} id="heading">
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <FieldLabel htmlFor={`${uid}-title`}>Title on the cover</FieldLabel>
          <Input
            id={`${uid}-title`}
            placeholder="Website design & development proposal"
            value={value.title}
            maxLength={L.title}
            onChange={(e) => set("title", e.target.value)}
            {...field("title")}
          />
          {err("title")}
        </div>
        <div className="grid gap-1.5">
          <FieldLabel htmlFor={`${uid}-subtitle`}>Subtitle</FieldLabel>
          <Input
            id={`${uid}-subtitle`}
            placeholder="A custom 5-page website: design, build and launch"
            value={value.subtitle}
            maxLength={L.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            {...field("subtitle")}
          />
          {err("subtitle")}
        </div>
        <FieldDescription>
          Without these, the cover uses the project name and description.
        </FieldDescription>
      </div>
    </SectionCard>
  );
}
