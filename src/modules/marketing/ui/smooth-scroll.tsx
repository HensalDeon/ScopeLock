"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

/**
 * Eased scrolling for the marketing pages. Mouse wheels step in 100px jumps;
 * Lenis turns those into one continuous glide. Touch keeps native scrolling
 * (phones already have momentum) and reduced-motion users get none of this.
 *
 * In-page links ("/#faq" while on "/") are taken over here, before Next's
 * <Link> sees the click, so the page glides to the section instead of jumping.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.12,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
    });

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const link = (event.target as Element | null)?.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href);
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        !url.hash
      ) {
        return;
      }
      const target = document.getElementById(
        decodeURIComponent(url.hash.slice(1)),
      );
      if (!target) return;

      event.preventDefault();
      event.stopPropagation();
      // Section offsets come from each section's scroll-margin-top.
      lenis.scrollTo(target, { duration: 1.1 });
      if (location.hash !== url.hash) history.pushState(null, "", url.hash);
    };

    // Capture phase on document runs before React's root listener.
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      lenis.destroy();
    };
  }, []);

  return null;
}
