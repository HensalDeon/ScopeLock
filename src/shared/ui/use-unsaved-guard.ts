"use client";

import { useEffect } from "react";

const LEAVE_MESSAGE =
  "You have changes that aren't saved. Leave this page without saving them?";

/**
 * While a form has unsaved edits, leaving asks first:
 * - closing the tab or reloading: the browser's own "Leave site?" prompt;
 * - an in-app link (a settings tab, the sidebar): a confirm before the
 *   client-side navigation, which the browser prompt doesn't cover.
 */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    // Capture phase on the document runs before Next's <Link> handler.
    const linkClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (an anchor like #billing): not leaving.
      if (url.pathname === window.location.pathname && url.hash) return;
      if (!window.confirm(LEAVE_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", linkClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", linkClick, true);
    };
  }, [dirty]);
}
