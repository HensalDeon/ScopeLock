"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Faint graph-paper grid behind a section, like the ruled sheet a scope gets
 * written on. On desktop the lines under the pointer darken a little, which
 * makes the page feel alive without moving anything.
 *
 * Place it as the first child of a `relative` parent. It listens on that parent,
 * writes the pointer position to CSS variables once per frame, and never
 * re-renders. Styles live in globals.css (`.sl-grid`).
 */
export function GridBackdrop({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = ref.current;
    const host = grid?.parentElement;
    if (!grid || !host) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      grid.style.setProperty("--mx", `${x}px`);
      grid.style.setProperty("--my", `${y}px`);
      grid.dataset.lit = "true";
    };
    const onMove = (event: PointerEvent) => {
      const box = grid.getBoundingClientRect();
      x = event.clientX - box.left;
      y = event.clientY - box.top;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      grid.dataset.lit = "false";
    };

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("sl-grid pointer-events-none absolute inset-0", className)}
    >
      <div className="sl-grid-lit absolute inset-0" />
    </div>
  );
}
