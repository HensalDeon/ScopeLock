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
import { ROLE_LABELS, type TeamRole } from "../domain/team";
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
  workspaces: {
    workspaceId: string;
    name: string;
    current: boolean;
    role: TeamRole;
  }[];
}) {
  const [state, run] = useActionState<FormState<string>, FormData>(
    switchWorkspace,
    IDLE,
  );
  const [pending, start] = useTransition();
  const current = workspaces.find((w) => w.current)?.name ?? "This workspace";
  return (
    <div className="grid gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`${current}: switch workspace`}
          className="group relative w-full rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {card}
          {pending && (
            <span
              role="status"
              className="absolute inset-0 flex items-center rounded-lg bg-background/90 px-3 text-sm text-muted-foreground"
            >
              Opening…
            </span>
          )}
          <ChevronsUpDown
            aria-hidden
            className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="font-normal text-muted-foreground">
            Your workspaces
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
              <span className="grid min-w-0 flex-1">
                <span className="truncate">{w.name}</span>
                <span className="text-xs text-muted-foreground">
                  {ROLE_LABELS[w.role].title}
                </span>
              </span>
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
