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
    // The total settles last: play once it is on screen, so the whole
    // moment is seen (on short laptops too).
    const row =
      el?.querySelector("[data-approval-total]") ??
      el?.querySelector("[data-approval-row]");
    if (!el || !row) return;
    // A beat after the row is in view, so on wide screens (where it's in
    // the first screen) the eye has reached it before the yes lands.
    let timer = 0;
    let settleTimer = 0;
    const settle = () => {
      // The struck total moves aside for the new one: measure, switch, then
      // slide from where it was (no jump).
      const strike = el.querySelector<HTMLElement>(".sl-strike");
      const before = strike?.getBoundingClientRect().left ?? 0;
      el.setAttribute("data-settled", "");
      const after = strike?.getBoundingClientRect().left ?? 0;
      if (strike && before !== after)
        strike.animate(
          [
            { transform: `translateX(${before - after}px)` },
            { transform: "none" },
          ],
          { duration: 360, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        );
    };
    const play = () => {
      timer = window.setTimeout(() => {
        el.setAttribute("data-play", "");
        settleTimer = window.setTimeout(settle, 1050);
      }, 700);
    };
    const stop = () => {
      window.clearTimeout(timer);
      window.clearTimeout(settleTimer);
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.setAttribute("data-play", "");
      el.setAttribute("data-settled", "");
      return;
    }
    if (!("IntersectionObserver" in window)) {
      play();
      return stop;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          play();
          io.disconnect();
        }
      },
      { threshold: 0.9 },
    );
    io.observe(row);
    return () => {
      io.disconnect();
      stop();
    };
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
  "[data-approval-play] .sl-wait{opacity:0!important}[data-approval-play] .sl-stamp,[data-approval-play] .sl-settle,[data-approval-play] .sl-pending{opacity:1!important}[data-approval-play] .sl-settle{visibility:visible!important}[data-approval-play] .sl-total .sl-strike{grid-area:1/1!important;justify-self:auto!important}[data-approval-play] .sl-strike{text-decoration-color:currentColor!important}";
