"use client";

import { Input } from "@/shared/ui/input";
import {
  AddButton,
  RemoveButton,
  SectionCard,
  type SectionKit,
} from "./proposal-kit";
import { L, newHighlight } from "./proposal-value";

/** Up to six "number + label" facts shown under the cover. */
export function HighlightsSection({ kit }: { kit: SectionKit }) {
  const { value, set, field, err } = kit;
  return (
    <SectionCard kit={kit} id="highlights">
      <div className="grid gap-2">
        {value.highlights.map((h, i) => (
          <div key={h.key} className="grid gap-1">
            <div className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.25rem] gap-2">
              <Input
                aria-label={`Highlight ${i + 1} number`}
                placeholder="5"
                value={h.value}
                maxLength={L.highlightValue}
                onChange={(e) =>
                  set(
                    "highlights",
                    value.highlights.map((x) =>
                      x.key === h.key ? { ...x, value: e.target.value } : x,
                    ),
                  )
                }
                {...field(`highlights.${i}.value`, `${h.key}.value`)}
                className="h-9"
              />
              <Input
                aria-label={`Highlight ${i + 1} label`}
                placeholder="Custom pages"
                value={h.label}
                maxLength={L.highlightLabel}
                onChange={(e) =>
                  set(
                    "highlights",
                    value.highlights.map((x) =>
                      x.key === h.key ? { ...x, label: e.target.value } : x,
                    ),
                  )
                }
                {...field(`highlights.${i}.label`, `${h.key}.label`)}
                className="h-9"
              />
              <RemoveButton
                label={`Remove highlight ${i + 1}`}
                onClick={() =>
                  set(
                    "highlights",
                    value.highlights.filter((x) => x.key !== h.key),
                  )
                }
              />
            </div>
            {err(`highlights.${i}.value`, `${h.key}.value`) ??
              err(`highlights.${i}.label`, `${h.key}.label`)}
          </div>
        ))}
        <AddButton
          disabled={value.highlights.length >= L.highlights}
          onClick={() =>
            set("highlights", [...value.highlights, newHighlight()])
          }
        >
          Add a highlight
        </AddButton>
      </div>
    </SectionCard>
  );
}
