"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

/** Focus ring for a panel that took focus from the keyboard. */
export const INLINE_PANEL_FOCUS =
  "outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * A button that turns into a small panel in place (a confirmation before
 * asking for money, a short form), keyboard-friendly:
 * - opening moves focus into the panel, which is announced by its label;
 * - Escape closes it;
 * - closing puts focus back on the button that opened it.
 *
 * `K` names the panels when one component has several ("ask", "received").
 */
export function useInlinePanel<K extends string = "open">() {
  const uid = useId();
  const [open, setOpen] = useState<K | null>(null);
  const opened = useRef<K | null>(null);

  // Visited pages stay mounted (CONVENTIONS §5): don't come back mid-panel.
  useLayoutEffect(() => () => setOpen(null), []);

  useEffect(() => {
    if (open) {
      opened.current = open;
      document.getElementById(`${uid}-panel`)?.focus();
      return;
    }
    const last = opened.current;
    opened.current = null;
    // Gone after a successful action (the row moved on): nothing to return to.
    if (last) document.getElementById(`${uid}-trigger-${last}`)?.focus();
  }, [open, uid]);

  const close = () => setOpen(null);
  return {
    open,
    close,
    /** Props for the button that opens panel `key`. */
    trigger: (key: K) => ({
      id: `${uid}-trigger-${key}`,
      onClick: () => setOpen(key),
    }),
    /** Props for the panel; `label` is what a screen reader announces. */
    panel: (label: string) => ({
      id: `${uid}-panel`,
      role: "group" as const,
      tabIndex: -1,
      "aria-label": label,
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        close();
      },
    }),
  };
}
