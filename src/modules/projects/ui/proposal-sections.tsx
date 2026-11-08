"use client";

import { Plus } from "lucide-react";
import { useId } from "react";
import type { CurrencyCode } from "@/shared/lib/currency";
import { Button } from "@/shared/ui/button";
import { AddonsSection } from "./proposal-addons";
import { HeadingSection } from "./proposal-heading";
import { HighlightsSection } from "./proposal-highlights";
import type { SectionKit } from "./proposal-kit";
import { LinesSection } from "./proposal-lines";
import { OverviewSection } from "./proposal-overview";
import { TimelineSection } from "./proposal-timeline";
import { ValidUntilSection } from "./proposal-valid-until";
import {
  newAddon,
  newHighlight,
  newStep,
  PROPOSAL_SECTIONS,
  type ProposalFormValue,
  type ProposalSectionId,
} from "./proposal-value";

export {
  PROPOSAL_SECTIONS,
  proposalRowKey,
  proposalToJson,
  type ProposalFormValue,
  type ProposalSectionId,
} from "./proposal-value";

type Props = {
  value: ProposalFormValue;
  /** The project's currency, for add-on prices. */
  currency: CurrencyCode;
  onChange: (update: (v: ProposalFormValue) => ProposalFormValue) => void;
  /** Error to show for a path under "proposal." (e.g. "highlights.0.value"). */
  errorFor: (path: string, touchKey?: string) => string | undefined;
  touch: (key: string) => void;
  edited: (path: string) => void;
  /** The project's payments, in order (milestone billing only). */
  payments?: SectionKit["payments"];
};

/**
 * Optional proposal sections around the priced scope. Each one is added with
 * a click and can be removed again; nothing is required. Each section is its
 * own component under ./proposal/.
 */
export function ProposalSections({
  value,
  onChange,
  errorFor,
  touch,
  edited,
  currency,
  payments = [],
}: Props) {
  const uid = useId();
  const inactive = PROPOSAL_SECTIONS.filter(
    (s) => !value.active.includes(s.id),
  );
  const kit: SectionKit = {
    uid,
    value,
    currency,
    set: (key, next) => {
      onChange((v) => ({ ...v, [key]: next }));
      edited(String(key));
    },
    field: (path, touchKey = path) => ({
      onBlur: () => touch(`proposal.${touchKey}`),
      "aria-invalid": Boolean(errorFor(path, touchKey)) || undefined,
    }),
    err: (path, touchKey) => {
      const message = errorFor(path, touchKey);
      return message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null;
    },
    remove: (id) =>
      onChange((v) => ({ ...v, active: v.active.filter((a) => a !== id) })),
    payments,
  };

  const section = (id: ProposalSectionId) => {
    switch (id) {
      case "heading":
        return <HeadingSection key={id} kit={kit} />;
      case "overview":
        return <OverviewSection key={id} kit={kit} />;
      case "highlights":
        return <HighlightsSection key={id} kit={kit} />;
      case "timeline":
        return <TimelineSection key={id} kit={kit} />;
      case "addons":
        return <AddonsSection key={id} kit={kit} />;
      case "clientProvides":
        return (
          <LinesSection
            key={id}
            kit={kit}
            id={id}
            hint="Logo, content, photos, feedback times."
          />
        );
      case "exclusions":
        return (
          <LinesSection
            key={id}
            kit={kit}
            id={id}
            hint="Spell out what's out of scope, before anyone asks."
          />
        );
      case "terms":
        return (
          <LinesSection
            key={id}
            kit={kit}
            id={id}
            hint="Validity, revisions, when work starts."
          />
        );
      case "validUntil":
        return <ValidUntilSection key={id} kit={kit} />;
    }
  };

  const add = (id: ProposalSectionId) => {
    // After React renders the new section, put the cursor in it.
    requestAnimationFrame(() => {
      const card = document.getElementById(`${uid}-section-${id}`);
      card
        ?.querySelector<HTMLElement>("input, textarea")
        ?.focus({ preventScroll: true });
      card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    onChange((v) => ({
      ...v,
      active: [...v.active, id],
      // List sections start with one empty row to fill in.
      highlights:
        id === "highlights" && v.highlights.length === 0
          ? [newHighlight()]
          : v.highlights,
      timeline:
        id === "timeline" && v.timeline.length === 0 ? [newStep()] : v.timeline,
      addons:
        id === "addons" && v.addons.length === 0 ? [newAddon()] : v.addons,
    }));
  };

  return (
    <div className="grid gap-3">
      {/* In the order added, so a new section appears next to the buttons.
          The client's document keeps its own fixed order. */}
      {value.active.map(section)}
      {inactive.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {inactive.map((s) => (
            <Button
              key={s.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => add(s.id)}
            >
              <Plus aria-hidden />
              {s.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
