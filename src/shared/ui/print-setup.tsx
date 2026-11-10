"use client";

import { useEffect } from "react";
import { cssString } from "@/shared/lib/css-string";

/**
 * Printed pages for a client document: A4, a footer with the document and
 * page numbers, and (with a cover) a full-bleed first page. Put it once on
 * each document page; "Save PDF" in the browser then gives a clean file.
 *
 * - The empty top margin boxes stop Chrome printing its own header (date
 *   and page title) even when "Headers and footers" is ticked; our footer
 *   replaces its bottom line.
 * - The rules live in <head> only while this page is on screen. Visited
 *   pages stay mounted in the background (CONVENTIONS §5), and a <style>
 *   left in the page would keep printing another document's footer.
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
  const css = `
    @page { size: A4; margin: 12mm 0 14mm;
      @top-left { content: ""; } @top-center { content: ""; } @top-right { content: ""; }
      @bottom-left { content: ${cssString(footer)}; font: 8pt system-ui, sans-serif; color: #8a8f98; padding-left: 14mm; }
      @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 8pt system-ui, sans-serif; color: #8a8f98; padding-right: 14mm; }
    }
    ${cover ? "@page :first { margin-top: 0; }" : ""}
  `;
  useEffect(() => {
    const style = document.createElement("style");
    style.dataset.printSetup = "";
    style.textContent = css;
    document.head.appendChild(style);
    return () => style.remove();
  }, [css]);
  return null;
}
