"use client";

import { useRouter } from "next/navigation";
import { Fragment } from "react";

/**
 * Visited pages stay alive with Cache Components. Wrap a "create" form so it
 * starts empty on every fresh visit (link click, redirect) but keeps what was
 * typed when the person comes back with the browser's Back button.
 */
export function FreshOnEachVisit({ children }: { children: React.ReactNode }) {
  const { bfcacheId } = useRouter();
  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
