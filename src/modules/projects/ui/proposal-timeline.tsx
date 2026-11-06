"use client";

import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import {
  AddButton,
  RemoveButton,
  SectionCard,
  type SectionKit,
} from "./proposal-kit";
import { L, newStep } from "./proposal-value";

/** Steps with durations; milestones are marked. */
export function TimelineSection({ kit }: { kit: SectionKit }) {
  const { value, set, field, err } = kit;
  return (
    <SectionCard kit={kit} id="timeline">
      <div className="grid gap-3">
        {value.timeline.map((step, i) => (
          <div
            key={step.key}
            className="grid gap-2 rounded-md border bg-canvas p-3"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_2.25rem]">
              <Input
                aria-label={`Step ${i + 1} name`}
                placeholder="Design"
                value={step.phase}
                maxLength={L.phase}
                onChange={(e) =>
                  set(
                    "timeline",
                    value.timeline.map((x) =>
                      x.key === step.key ? { ...x, phase: e.target.value } : x,
                    ),
                  )
                }
                {...field(`timeline.${i}.phase`, `${step.key}.phase`)}
                className="h-9 bg-background"
              />
              <Input
                aria-label={`Step ${i + 1} duration`}
                placeholder="Days 1–7"
                value={step.duration}
                maxLength={L.duration}
                onChange={(e) =>
                  set(
                    "timeline",
                    value.timeline.map((x) =>
                      x.key === step.key
                        ? { ...x, duration: e.target.value }
                        : x,
                    ),
                  )
                }
                className="col-start-1 row-start-2 h-9 bg-background sm:col-start-2 sm:row-start-1"
              />
              <RemoveButton
                label={`Remove step ${i + 1}`}
                onClick={() =>
                  set(
                    "timeline",
                    value.timeline.filter((x) => x.key !== step.key),
                  )
                }
                className="col-start-2 row-start-1 sm:col-start-3"
              />
            </div>
            <Input
              aria-label={`Step ${i + 1} description`}
              placeholder="What happens in this step"
              value={step.description}
              maxLength={L.stepDescription}
              onChange={(e) =>
                set(
                  "timeline",
                  value.timeline.map((x) =>
                    x.key === step.key
                      ? { ...x, description: e.target.value }
                      : x,
                  ),
                )
              }
              className="h-9 bg-background"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={step.isMilestone}
                onCheckedChange={(on) =>
                  set(
                    "timeline",
                    value.timeline.map((x) =>
                      x.key === step.key ? { ...x, isMilestone: on } : x,
                    ),
                  )
                }
              />
              Mark as a milestone
            </label>
            {err(`timeline.${i}.phase`, `${step.key}.phase`)}
          </div>
        ))}
        <AddButton
          disabled={value.timeline.length >= L.timeline}
          onClick={() => set("timeline", [...value.timeline, newStep()])}
        >
          Add a step
        </AddButton>
      </div>
    </SectionCard>
  );
}
