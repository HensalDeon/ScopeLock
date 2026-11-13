"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useActionState, useTransition } from "react";
import { IDLE, type FormState } from "@/shared/lib/form-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { switchWorkspace } from "../server/session-actions";

/**
 * The sidebar's workspace card, for someone in more than one workspace
 * (their own and an agency's): it opens the others.
 */
export function WorkspaceSwitcher({
  card,
  workspaces,
}: {
  /** The current workspace's card (name, initials, type). */
  card: React.ReactNode;
  workspaces: { workspaceId: string; name: string; current: boolean }[];
}) {
  const [state, run] = useActionState<FormState<string>, FormData>(
    switchWorkspace,
    IDLE,
  );
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Switch workspace"
          className="group relative w-full rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {card}
          <ChevronsUpDown
            aria-hidden
            className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="font-normal text-muted-foreground">
            {pending ? "Opening…" : "Your workspaces"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((w) => (
            <DropdownMenuItem
              key={w.workspaceId}
              disabled={w.current || pending}
              onSelect={() =>
                start(() => {
                  const data = new FormData();
                  data.set("workspaceId", w.workspaceId);
                  run(data);
                })
              }
            >
              <span className="min-w-0 flex-1 truncate">{w.name}</span>
              {w.current && <Check aria-label="Open now" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {state.status === "error" && state.message && (
        <p role="alert" className="px-1 text-[13px] text-destructive">
          {state.message}
        </p>
      )}
    </div>
  );
}
