"use client";

/**
 * Tells screen readers what just happened, from anywhere, through one
 * polite live region on the page (created on first use). Used after an
 * action whose button disappears on success (the row moves on), so the
 * result isn't silent.
 */
export function announce(message: string) {
  if (typeof document === "undefined" || !message) return;
  let region = document.getElementById("app-announcer");
  if (!region) {
    region = document.createElement("div");
    region.id = "app-announcer";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    region.className = "sr-only";
    document.body.appendChild(region);
  }
  // Clear first so the same message twice is still read out.
  region.textContent = "";
  const target = region;
  requestAnimationFrame(() => {
    target.textContent = message;
  });
}

/** Moves focus once the page has re-rendered after an action. */
export function focusAfterUpdate(id: string) {
  if (typeof document === "undefined") return;
  setTimeout(() => document.getElementById(id)?.focus(), 150);
}

/**
 * Wraps a form action: on success, announce its message and move focus to
 * `focusId` (the place on the page that now shows the result).
 */
export function announcing<S extends { status: string; message?: string }>(
  run: (state: S, data: FormData) => Promise<S>,
  focusId: string,
) {
  return async (state: S, data: FormData): Promise<S> => {
    const next = await run(state, data);
    if (next.status === "success") {
      if (next.message) announce(next.message);
      focusAfterUpdate(focusId);
    }
    return next;
  };
}
