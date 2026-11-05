"use client";

/**
 * Full page load into or out of the signed-in app.
 *
 * With Cache Components, Next keeps up to 3 visited pages alive (hidden with
 * React <Activity>) and restores their state on return. Across a sign-in or
 * sign-out that is wrong, and on a shared computer a privacy leak: the next
 * person could see the previous account's open menus or half-typed forms. A
 * real page load drops all client state, router cache included.
 *
 * `replace` so Back doesn't return to a form that's no longer valid.
 */
export function crossAuthBoundary(path: string): void {
  window.location.replace(path);
}
