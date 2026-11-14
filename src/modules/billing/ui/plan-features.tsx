"use client";

import { Switch } from "@/shared/ui/switch";
import {
  FEATURE_LABELS,
  PLAN_FEATURES,
  type PlanFeature,
} from "../domain/plans";

/** Admin: the switches for what a plan unlocks. */
export function PlanFeatures({
  on,
  onToggle,
}: {
  on: readonly PlanFeature[];
  onToggle: (feature: PlanFeature, on: boolean) => void;
}) {
  return (
    <ul className="grid divide-y rounded-lg border">
      {PLAN_FEATURES.map((f) => {
        const info = FEATURE_LABELS[f];
        return (
          <li key={f}>
            <label className="flex cursor-pointer items-start justify-between gap-4 px-4 py-3">
              <span className="grid gap-0.5">
                <span className="text-sm font-medium">{info.title}</span>
                <span className="text-sm text-pretty text-muted-foreground">
                  {info.detail}
                  {!info.built &&
                    " Not built yet: the compare table shows it as “soon”; mark its line below as soon too."}
                </span>
              </span>
              <Switch
                className="mt-0.5"
                checked={on.includes(f)}
                onCheckedChange={(checked) => onToggle(f, checked)}
              />
            </label>
          </li>
        );
      })}
    </ul>
  );
}
