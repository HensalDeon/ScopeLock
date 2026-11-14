"use client";

import { Printer } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";

/** Opens the browser's print dialog, where "Save as PDF" lives. */
export function PrintButton({
  label = "Save PDF",
  variant = "default",
  iconOnPhones = false,
}: {
  label?: string;
  /** Outline where printing isn't the page's main action (client pages). */
  variant?: "default" | "outline";
  /** Phones: just the icon (a sticky header has little room). */
  iconOnPhones?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      className={iconOnPhones ? "max-sm:size-11 max-sm:px-0" : TOUCH}
      aria-label={iconOnPhones ? label : undefined}
      onClick={() => window.print()}
    >
      <Printer aria-hidden />
      <span className={iconOnPhones ? "max-sm:hidden" : undefined}>
        {label}
      </span>
    </Button>
  );
}
