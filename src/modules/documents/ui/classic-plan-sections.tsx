import { Check, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { ProposalDocumentData } from "../domain/document-data";
import type { Section, SectionKit } from "./classic-section-kit";

/** Timeline, optional add-ons, what's needed and excluded, and terms. */
export function planSections(
  data: ProposalDocumentData,
  { money }: SectionKit,
): Section[] {
  const sections: Section[] = [];

  if (data.timeline.length > 0) {
    sections.push({
      title: "Timeline",
      body: (
        <ol className="grid">
          {data.timeline.map((step, i) => (
            <li
              key={step.id}
              className="grid break-inside-avoid grid-cols-[5.5rem_minmax(0,1fr)] gap-4"
            >
              <p className="pt-px text-right text-[11px] font-semibold tracking-[0.08em] text-(--doc-accent-text) uppercase">
                {step.duration}
              </p>
              <div
                className={cn(
                  "relative border-l-2 border-[#e7e4dd] pb-5 pl-5",
                  i === data.timeline.length - 1 && "border-l-transparent",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1 -left-[7px] size-3 rounded-full border-2 border-white",
                    step.isMilestone ? "bg-(--doc-accent)" : "bg-[#cfcac0]",
                  )}
                />
                <h3 className="text-[0.9rem] font-semibold">
                  {step.phase}
                  {step.isMilestone && (
                    <span className="ml-2 rounded-full bg-(--doc-soft) px-2 py-0.5 text-[11px] font-medium tracking-wide text-(--doc-soft-text) uppercase">
                      Milestone
                      {step.payment
                        ? ` · ${money(step.payment.amount)} due`
                        : ""}
                    </span>
                  )}
                </h3>
                {step.description && (
                  <p className="mt-0.5 text-[0.85rem] leading-relaxed text-pretty text-[#565a63]">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      ),
    });
  }

  if (data.addons.length > 0) {
    sections.push({
      title: "Optional add-ons",
      body: (
        <div className="grid gap-3">
          <p className="text-[0.9rem] text-[#565a63]">
            Not part of the total above. Ask for any of these now or later, and{" "}
            {data.voice === "I" ? "I'll" : "we'll"} send it as a separate change
            for you to approve.
          </p>
          <table className="w-full border-collapse text-[0.85rem]">
            <tbody>
              {data.addons.map((addon) => (
                <tr
                  key={addon.id}
                  className="break-inside-avoid border-b border-[#ece9e3]"
                >
                  <td className="py-2.5 pr-3">
                    <strong className="font-semibold">{addon.title}</strong>
                    {addon.description && (
                      <span className="block text-xs text-[#6b6f78]">
                        {addon.description}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap tabular-nums">
                    <strong className="font-semibold">
                      {money(addon.amount)}
                    </strong>
                    {addon.unit && (
                      <span className="ml-1 text-xs text-[#6b6f78]">
                        {addon.unit}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    });
  }

  if (data.clientProvides.length > 0 || data.exclusions.length > 0) {
    const we = data.voice === "I" ? "I" : "we";
    sections.push({
      title: "Before we start",
      body: (
        <div className="grid gap-6 @xl:grid-cols-2">
          {data.clientProvides.length > 0 && (
            <ListBlock
              title={`What ${we} need from you`}
              items={data.clientProvides}
              icon="check"
            />
          )}
          {data.exclusions.length > 0 && (
            <ListBlock title="Not included" items={data.exclusions} icon="x" />
          )}
        </div>
      ),
    });
  }

  if (data.terms.length > 0) {
    sections.push({
      title: "Terms",
      body: (
        <ol className="grid list-decimal gap-1.5 pl-5 text-[0.85rem] leading-relaxed text-[#3a3d44] marker:text-(--doc-accent-text) marker:tabular-nums">
          {data.terms.map((term, i) => (
            <li key={i} className="pl-1 text-pretty">
              {term}
            </li>
          ))}
        </ol>
      ),
    });
  }

  return sections;
}

function ListBlock({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: "check" | "x";
}) {
  const Icon = icon === "check" ? Check : X;
  return (
    <div className="break-inside-avoid">
      <h3 className="mb-2 text-[0.9rem] font-semibold">{title}</h3>
      <ul className="grid gap-1.5 text-[0.85rem] text-[#3a3d44]">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <Icon
              aria-hidden
              className={cn(
                "mt-[3px] size-3.5 shrink-0",
                icon === "check"
                  ? "text-(--doc-accent-text)"
                  : "text-[#9a9ea6]",
              )}
            />
            <span className="text-pretty">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
