import type { ReactNode } from "react";
import { formatMoney, type Minor } from "@/shared/lib/money";
import type { ProposalDocumentData } from "../domain/document-data";

/** One numbered section of the classic proposal. */
export type Section = { title: string; body: ReactNode };

/** What every section needs: money in the document's currency, paragraphs, the heading font. */
export type SectionKit = {
  money: (amount: Minor) => string;
  paragraphs: (text: string) => ReactNode[];
  headingFont: string;
};

export function sectionKit(
  data: Pick<ProposalDocumentData, "currency">,
  headingFont: string,
): SectionKit {
  return {
    headingFont,
    money: (amount) => formatMoney(amount, data.currency),
    paragraphs: (text) =>
      text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p
            key={i}
            className="leading-relaxed text-pretty whitespace-pre-line"
          >
            {p}
          </p>
        )),
  };
}
