import { cssString } from "@/shared/lib/css-string";

/**
 * Printed pages for a client document: A4, a footer with the document and
 * page numbers, and (with a cover) a full-bleed first page. Put it once on
 * each document page; "Save PDF" in the browser then gives a clean file.
 */
export function PrintSetup({
  footer,
  cover = false,
}: {
  /** Left of the footer, e.g. "Asha Designs · Proposal P-007". */
  footer: string;
  /** The first page is a dark cover that runs to the top edge. */
  cover?: boolean;
}) {
  return (
    <style>{`
      @page { size: A4; margin: 12mm 0 14mm;
        @bottom-left { content: ${cssString(footer)}; font: 8pt system-ui, sans-serif; color: #8a8f98; padding-left: 14mm; }
        @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 8pt system-ui, sans-serif; color: #8a8f98; padding-right: 14mm; }
      }
      ${cover ? "@page :first { margin-top: 0; }" : ""}
    `}</style>
  );
}
