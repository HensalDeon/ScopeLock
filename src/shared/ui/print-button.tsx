"use client";

import { Printer } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";

/** Opens the browser's print dialog, where "Save as PDF" lives. */
export function PrintButton({
  label = "Save PDF",
  variant = "default",
}: {
  label?: string;
  /** Outline where printing isn't the page's main action (client pages). */
  variant?: "default" | "outline";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      className={TOUCH}
      onClick={() => window.print()}
    >
      <Printer aria-hidden />
      {label}
    </Button>
  );
}
