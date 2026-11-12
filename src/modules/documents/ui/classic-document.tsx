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
import { AcceptanceBlock, type DocumentAcceptance } from "./acceptance-block";

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
  titleAs = "h1",
  acceptance = null,
  note = null,
  draft = false,
}: {
  /** Not sent yet: says so on screen and on paper, with no issue date. */
  draft?: boolean;
  /** A line added after sending (the GST-change note), inside the sheet. */
  note?: string | null;
  /** The client's answer, printed before the footer. */
  acceptance?: DocumentAcceptance | null;
  /** "h2" when the page around it has its own h1 (settings preview). */
  titleAs?: "h1" | "h2";
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
        titleAs={titleAs}
        draft={draft}
      />
      {draft && (
        <div
          role="note"
          className="border-b-2 border-[#1d1f24] bg-white px-6 py-3 text-[#1d1f24] @xl:px-12"
        >
          <p className="text-sm font-semibold">Draft, not sent</p>
          <p className="text-[0.85rem]">
            Your client hasn&apos;t received this. Send it from ScopeLock so
            they can approve it; a printed draft isn&apos;t an offer.
          </p>
        </div>
      )}

      {data.highlights.length > 0 && (
        <div className="grid grid-cols-2 border-b border-[#e7e4dd] bg-(--doc-soft) @xl:auto-cols-fr @xl:grid-flow-col @xl:grid-cols-none">
          {data.highlights.map((h, i) => (
            <div
              key={`${h.label}-${i}`}
              className="border-r border-b border-[#e7e4dd] px-3 py-4 text-center last:border-r-0 @xl:border-b-0"
            >
              <p
                className={cn(
                  "text-[1.55rem] leading-none text-[#1d1f24]",
                  headingFont,
                )}
              >
                {h.value}
              </p>
              <p className="mt-1.5 text-[11px] font-medium tracking-[0.16em] text-(--doc-soft-text) uppercase">
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

        {acceptance && <AcceptanceBlock acceptance={acceptance} />}
        {note && (
          <section
            aria-label="Note"
            className="grid [break-inside:avoid] gap-1 border-l-2 border-(--doc-accent) pl-4 text-[0.88rem] leading-relaxed text-pretty text-[#3a3d44]"
          >
            <p className="text-[11px] font-semibold tracking-[0.14em] text-(--doc-soft-text) uppercase">
              Note
            </p>
            <p>{note}</p>
          </section>
        )}

        <footer className="mt-2 flex [break-before:avoid] flex-wrap items-baseline justify-between gap-2 border-t border-[#e7e4dd] pt-5 text-xs text-[#6b6f78]">
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
