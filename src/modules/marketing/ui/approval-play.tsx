"use client";

import { useEffect, useRef } from "react";

/**
 * Plays the hero's approval once, when CR-001's row is mostly in view
 * (CSS in globals.css: "the approval lands once"). Until then the row waits
 * for Rahul; without JavaScript or with reduced motion the approved state
 * shows from the start.
 */
export function ApprovalPlay({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const row = el?.querySelector("[data-approval-row]");
    if (!el || !row) return;
    const play = () => el.setAttribute("data-play", "");
    if (!("IntersectionObserver" in window)) return play();
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          play();
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(row);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} data-approval-play>
      {children}
      <noscript>
        <style>{NO_SCRIPT}</style>
      </noscript>
    </div>
  );
}

/** Without JavaScript nothing would play: show the approved state. */
const NO_SCRIPT =
  "[data-approval-play] .sl-wait{opacity:0!important}[data-approval-play] .sl-stamp,[data-approval-play] .sl-settle{opacity:1!important}[data-approval-play] .sl-strike{text-decoration-color:currentColor!important}";
