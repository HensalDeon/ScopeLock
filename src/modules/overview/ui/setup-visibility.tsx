"use client";

import { useActionState } from "react";
import { setSetupVisibility } from "@/modules/workspace";
import { IDLE } from "@/shared/lib/form-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";

/** "Hide these steps" on the checklist, or "Show the setup steps" after. */
export function SetupVisibility({
  hide,
  label,
  className,
}: {
  /** True: the button hides the checklist; false: it brings it back. */
  hide: boolean;
  label: string;
  className?: string;
}) {
  const [, action, pending] = useActionState(setSetupVisibility, IDLE);
  return (
    <form action={action} className={className}>
      <input type="hidden" name="hidden" value={String(hide)} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending}
        className={cn("text-muted-foreground", TOUCH)}
      >
        {pending ? (hide ? "Hiding…" : "Showing…") : label}
      </Button>
    </form>
  );
}
