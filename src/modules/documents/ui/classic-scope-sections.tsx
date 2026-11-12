import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Minor } from "@/shared/lib/money";
import type { ProposalDocumentData } from "../domain/document-data";
import { gstOver, withGst } from "../domain/gst";
import type { Section, SectionKit } from "./classic-section-kit";

/** Overview, what's included, investment and the payment schedule. */
export function scopeSections(
  data: ProposalDocumentData,
  { money, paragraphs, headingFont }: SectionKit,
): Section[] {
  const sections: Section[] = [];
  // Each payment is its own invoice, so GST is added per payment.
  const gst = gstOver(
    data.milestones.map((m) => m.amount),
    data.gstPercent,
  );
  const gstLine = (amount: Minor) => {
    const total = withGst(amount, data.gstPercent);
    return total === null ? null : (
      <span className="block text-xs font-normal text-[#6b6f78]">
        {money(total)} with GST
      </span>
    );
  };

  if (data.overview || data.callout) {
    sections.push({
      title: "Project overview",
      body: (
        <div className="grid max-w-[68ch] gap-3 text-[0.95rem] text-[#3a3d44]">
          {data.overview && paragraphs(data.overview)}
          {data.callout && (
            <p className="border-l-[3px] border-(--doc-accent) bg-(--doc-soft) px-4 py-3 text-[0.9rem] leading-relaxed text-pretty text-[#2a2d33]">
              {data.callout}
            </p>
          )}
        </div>
      ),
    });
  }

  sections.push({
    title: "What's included",
    body: (
      <div className="grid gap-3 @xl:grid-cols-2">
        {data.items.map((item, i) => (
          <div
            key={item.id}
            className="grid break-inside-avoid content-start gap-2 rounded-[2px] border border-[#e7e4dd] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--doc-soft) text-[11px] font-semibold text-(--doc-soft-text) tabular-nums">
                {i + 1}
              </span>
              <h3 className="min-w-0 flex-1 text-[0.95rem] leading-snug font-semibold">
                {item.title}
              </h3>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {money(item.amount)}
              </p>
            </div>
            {item.description && (
              <p className="pl-9 text-[0.85rem] leading-relaxed text-pretty text-[#565a63]">
                {item.description}
              </p>
            )}
            {item.includes.length > 0 && (
              <ul className="grid gap-1.5 pl-9 text-[0.85rem] text-[#3a3d44]">
                {item.includes.map((point, j) => (
                  <li key={j} className="flex gap-2">
                    <Check
                      aria-hidden
                      className="mt-[3px] size-3.5 shrink-0 text-(--doc-accent-text)"
                    />
                    <span className="text-pretty">{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    ),
  });

  sections.push({
    title: "Price",
    body: (
      // The lines and their prices are in "What's included" just above;
      // the investment is the total, once, without repeating them.
      <div className="grid break-inside-avoid items-start gap-4 @xl:grid-cols-[minmax(0,26rem)]">
        <div className="grid content-center gap-1 rounded-[2px] bg-(--doc-cover-bg) px-6 py-6 text-(--doc-cover-text)">
          <p className="text-[11px] tracking-[0.2em] text-(--doc-cover-label) uppercase">
            Project fee
          </p>
          <p
            className={cn(
              "text-[2.4rem] leading-none [font-variant-numeric:lining-nums_proportional-nums]",
              headingFont,
            )}
          >
            {money(data.total)}
          </p>
          {gst && (
            <div className="grid gap-0.5 text-sm tabular-nums">
              <p className="font-medium">
                plus {data.gstPercent}% GST ({money(gst.tax)})
              </p>
              <p>
                <span className="font-semibold">{money(gst.total)}</span> with
                GST
              </p>
            </div>
          )}
          <p className="mt-1 text-xs text-(--doc-cover-muted)">
            For the scope above.{" "}
            {data.gstPercent
              ? `Prices are before GST; ${data.gstPercent}% GST is added on each invoice, as it applies when invoiced. `
              : ""}
            Anything extra is quoted separately before work starts.
          </p>
        </div>
      </div>
    ),
  });

  sections.push({
    title: "Payment schedule",
    body: (
      <table className="w-full border-collapse break-inside-avoid text-[0.85rem]">
        <thead>
          <tr className="border-b border-[#1d1f24] text-left text-[11px] tracking-[0.14em] text-[#6b6f78] uppercase">
            <th className="py-2 font-medium">Payment</th>
            <th className="py-2 pl-4 text-right font-medium">Share</th>
            <th className="py-2 pl-4 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.billingModel === "upfront" ? (
            <tr className="border-b border-[#ece9e3]">
              <td className="py-2.5 pr-3">
                <strong className="font-semibold">Full payment</strong>
                <span className="block text-xs text-[#6b6f78]">
                  Before work starts
                </span>
              </td>
              <td className="py-2.5 pl-4 text-right tabular-nums">100%</td>
              <td className="py-2.5 pl-4 text-right font-semibold whitespace-nowrap tabular-nums">
                {money(data.total)}
                {gstLine(data.total)}
              </td>
            </tr>
          ) : (
            data.milestones.map((m) => (
              <tr key={m.id} className="border-b border-[#ece9e3]">
                <td className="py-2.5 pr-3">
                  <strong className="font-semibold">{m.name}</strong>
                  {m.dueWhen && (
                    <span className="block text-xs text-[#6b6f78]">
                      {m.dueWhen}
                    </span>
                  )}
                </td>
                <td className="py-2.5 pl-4 text-right tabular-nums">
                  {m.percent}%
                </td>
                <td className="py-2.5 pl-4 text-right font-semibold whitespace-nowrap tabular-nums">
                  {money(m.amount)}
                  {gstLine(m.amount)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    ),
  });

  return sections;
}
