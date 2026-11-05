"use client";

import { Printer } from "lucide-react";
import { Button } from "@/shared/ui/button";

/** Opens the browser's print dialog, where "Save as PDF" lives. */
export function PrintButton({
  label = "Print / Save PDF",
}: {
  label?: string;
}) {
  return (
    <Button type="button" onClick={() => window.print()}>
      <Printer aria-hidden />
      {label}
    </Button>
  );
}
