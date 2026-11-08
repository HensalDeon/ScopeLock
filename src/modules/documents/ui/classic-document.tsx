import type { CSSProperties } from "react";
import { formatPhone } from "@/shared/lib/phone";
import { cn } from "@/shared/lib/utils";
import type { ProposalDocumentData } from "../domain/document-data";
import { NO_IMAGES, type DocumentImages } from "../domain/images";
import { documentPalette, type DocumentStyle } from "../domain/style";
import { Cover } from "./classic-cover";
import { planSections } from "./classic-plan-sections";
import { scopeSections } from "./classic-scope-sections";
import { sectionKit } from "./classic-section-kit";
import { documentSerif } from "./fonts";

/**
 * "Classic" proposal template: dark (or tinted) cover, highlights strip and
 * numbered sections, modelled on the Estimator quotation builder.
 *
 * Pure presentation: no data fetching, no browser APIs, so the same component
 * renders the settings preview, "Preview as client", the client portal and
 * the printed A4 page. Layout responds to its own width (container queries),
 * not the screen's, so it looks right in a narrow preview pane too.
 */
export function ClassicDocument({
  data,
  style,
  images = NO_IMAGES,
  className,
}: {
  data: ProposalDocumentData;
  style: DocumentStyle;
  /** Signed URLs for the uploaded logo and cover image, if any. */
  images?: DocumentImages;
  className?: string;
}) {
  const palette = documentPalette(style);
  const vars = {
    "--doc-accent": palette.accent,
    "--doc-accent-text": palette.accentText,
    "--doc-on-accent": palette.onAccent,
    "--doc-soft": palette.soft,
    "--doc-soft-text": palette.softText,
    "--doc-cover-bg": palette.coverBg,
    "--doc-cover-text": palette.coverText,
    "--doc-cover-muted": palette.coverMuted,
    "--doc-cover-label": palette.coverLabel,
    "--doc-cover-rule": palette.coverRule,
    "--doc-ring": palette.ring,
  } as CSSProperties;
  const serif = style.headingFont === "serif";
  const headingFont = serif
    ? "font-(family-name:--font-doc-serif) font-semibold tracking-[-0.01em]"
    : "font-sans font-semibold tracking-[-0.02em]";

  const kit = sectionKit(data, headingFont);
  const sections = [...scopeSections(data, kit), ...planSections(data, kit)];

  return (
    <article
      className={cn(
        documentSerif.variable,
        "@container overflow-hidden bg-white text-[#1d1f24] [print-color-adjust:exact]",
        className,
      )}
      style={vars}
    >
      <Cover
        data={data}
        style={style}
        images={images}
        headingFont={headingFont}
      />

      {data.highlights.length > 0 && (
        <div className="grid grid-cols-2 border-b border-[#e7e4dd] bg-(--doc-soft) @xl:auto-cols-fr @xl:grid-flow-col @xl:grid-cols-none">
          {data.highlights.map((h, i) => (
            <div
              key={`${h.label}-${i}`}
              className="border-r border-b border-[#e7e4dd] px-3 py-4 text-center last:border-r-0 @xl:border-b-0"
            >
              <p
                className={cn(
                  "text-[1.6rem] leading-none text-[#1d1f24]",
                  headingFont,
                )}
              >
                {h.value}
              </p>
              <p className="mt-1.5 text-[10px] font-medium tracking-[0.16em] text-(--doc-soft-text) uppercase">
                {h.label}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-10 px-6 py-9 @xl:px-12 @xl:py-12">
        {sections.map((section, index) => (
          <section
            key={section.title}
            className="grid break-inside-avoid-page gap-4"
          >
            <h2
              className={cn(
                "flex items-baseline gap-3 text-[1.55rem] leading-tight text-[#1d1f24] @xl:text-[1.85rem]",
                headingFont,
              )}
            >
              <span className="font-sans text-xs font-semibold tracking-normal text-(--doc-accent-text) tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              {section.title}
            </h2>
            {section.body}
          </section>
        ))}

        <footer className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t border-[#e7e4dd] pt-5 text-xs text-[#6b6f78]">
          <p>
            {data.business.name}
            {data.business.email ? ` · ${data.business.email}` : ""}
            {data.business.phone
              ? ` · ${formatPhone(data.business.phone)}`
              : ""}
          </p>
          <p className="tabular-nums">Proposal {data.reference}</p>
        </footer>
      </div>
    </article>
  );
}
