"use client";

import { FieldDescription } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { MoneyInput } from "@/shared/ui/money-input";
import {
  AddButton,
  RemoveButton,
  SectionCard,
  type SectionKit,
} from "./proposal-kit";
import { L, newAddon } from "./proposal-value";

/** Priced extras that are not in the total; each can become a change request. */
export function AddonsSection({ kit }: { kit: SectionKit }) {
  const { value, set, field, err, currency } = kit;
  return (
    <SectionCard kit={kit} id="addons">
      <div className="grid gap-3">
        <FieldDescription>
          Not part of the total. Your client can ask for any of these later as a
          change.
        </FieldDescription>
        {value.addons.map((addon, i) => (
          <div
            key={addon.key}
            className="grid gap-2 rounded-md border bg-canvas p-3"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_6rem_2.25rem]">
              <Input
                aria-label={`Add-on ${i + 1} name`}
                placeholder="Extra page"
                value={addon.title}
                maxLength={L.addonTitle}
                onChange={(e) =>
                  set(
                    "addons",
                    value.addons.map((x) =>
                      x.key === addon.key ? { ...x, title: e.target.value } : x,
                    ),
                  )
                }
                {...field(`addons.${i}.title`, `${addon.key}.title`)}
                className="h-9 bg-background"
              />
              <MoneyInput
                currency={currency}
                wrapperClassName="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1"
                aria-label={`Add-on ${i + 1} price, in ${currency}`}
                value={addon.amount}
                onChange={(e) =>
                  set(
                    "addons",
                    value.addons.map((x) =>
                      x.key === addon.key
                        ? { ...x, amount: e.target.value }
                        : x,
                    ),
                  )
                }
                {...field(`addons.${i}.amount`, `${addon.key}.amount`)}
                className="h-9 bg-background"
              />
              <Input
                aria-label={`Add-on ${i + 1} unit`}
                placeholder="/ page"
                value={addon.unit}
                maxLength={L.unit}
                onChange={(e) =>
                  set(
                    "addons",
                    value.addons.map((x) =>
                      x.key === addon.key ? { ...x, unit: e.target.value } : x,
                    ),
                  )
                }
                className="col-start-1 row-start-3 h-9 bg-background sm:col-start-3 sm:row-start-1"
              />
              <RemoveButton
                label={`Remove add-on ${i + 1}`}
                onClick={() =>
                  set(
                    "addons",
                    value.addons.filter((x) => x.key !== addon.key),
                  )
                }
                className="col-start-2 row-start-1 sm:col-start-4"
              />
            </div>
            <Input
              aria-label={`Add-on ${i + 1} description`}
              placeholder="Short description (optional)"
              value={addon.description}
              maxLength={L.addonDescription}
              onChange={(e) =>
                set(
                  "addons",
                  value.addons.map((x) =>
                    x.key === addon.key
                      ? { ...x, description: e.target.value }
                      : x,
                  ),
                )
              }
              className="h-9 bg-background"
            />
            {err(`addons.${i}.title`, `${addon.key}.title`) ??
              err(`addons.${i}.amount`, `${addon.key}.amount`)}
          </div>
        ))}
        <AddButton
          disabled={value.addons.length >= L.addons}
          onClick={() => set("addons", [...value.addons, newAddon()])}
        >
          Add an add-on
        </AddButton>
      </div>
    </SectionCard>
  );
}
