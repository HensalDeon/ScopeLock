"use client";

import { ChevronDown } from "lucide-react";
import { useId, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { TOUCH_LINK } from "@/shared/ui/touch";

/**
 * "See the whole proposal": opens the full sheet under a phone money slip.
 * Says when it's open, and can be closed from the end of the sheet too.
 */
export function DocDetails({
  show,
  hide,
  children,
}: {
  show: string;
  hide: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const id = useId();
  const link = cn(
    "inline-flex items-center gap-1.5 text-[14px] font-medium underline underline-offset-4",
    TOUCH_LINK,
  );
  return (
    <div>
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={link}
      >
        {open ? hide : show}
        <ChevronDown
          aria-hidden
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      <div id={id} hidden={!open} className="mt-2">
        {children}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            toggle.current?.focus({ preventScroll: true });
            toggle.current?.scrollIntoView({ block: "center" });
          }}
          className={cn(link, "mt-2")}
        >
          {hide}
          <ChevronDown aria-hidden className="size-4 rotate-180" />
        </button>
      </div>
    </div>
  );
}
