"use client";

import { useEffect } from "react";

/**
 * While a form has unsaved edits, closing the tab or reloading asks first
 * (the browser's own "Leave site?" prompt). In-app links don't trigger it;
 * settings forms show their own "Unsaved" line for that.
 */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}
