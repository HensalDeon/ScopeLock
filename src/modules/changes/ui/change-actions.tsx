"use client";

import { Pencil } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useActionState } from "react";
import { formatDateTime } from "@/shared/lib/dates";
import { IDLE } from "@/shared/lib/form-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ShareLink } from "@/shared/ui/share-link";
import { SideCard, SideCardText, SideCardTitle } from "@/shared/ui/side-card";
import {
  INLINE_PANEL_FOCUS,
  useInlinePanel,
} from "@/shared/ui/use-inline-panel";
import type { ChangeRequest } from "../domain/change-request";
import {
  cancelChange,
  deleteChange,
  sendChange,
  withdrawChange,
  type ChangeFormState,
} from "../server/actions";

type Action = (s: ChangeFormState, d: FormData) => Promise<ChangeFormState>;

/**
 * What the freelancer can do with a change request right now: edit and
 * send a draft, share or take back a sent one, cancel or delete.
 */
export function ChangeActions({
  change,
  projectId,
  editHref,
  link,
  emailVerified,
  clientFirstName,
}: {
  change: Pick<
    ChangeRequest,
    "number" | "status" | "everSent" | "sentAt" | "decision"
  >;
  projectId: string;
  editHref: Route;
  /** The CR's page on the client link, with the WhatsApp message. */
  link: { url: string; phone: string | null; message: string } | null;
  emailVerified: boolean;
  clientFirstName: string;
}) {
  const ids = { projectId, number: change.number };

  if (change.status === "draft") {
    return (
      <SideCard>
        <SideCardTitle>
          {change.everSent
            ? `Taken back from ${clientFirstName}`
            : `Draft: only you can see it`}
        </SideCardTitle>
        <SideCardText>
          {change.everSent
            ? `${clientFirstName} sees "being updated" until you send it again.`
            : `When you send it, ${clientFirstName} gets it on the same link as the proposal.`}
        </SideCardText>
        {!emailVerified && (
          <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-warning-ink">
            Confirm your email first, with the code from the banner at the top.
          </p>
        )}
        <Run
          action={sendChange}
          {...ids}
          label={`Send to ${clientFirstName}`}
          pendingLabel="Sending…"
          wide
        />
        <div className="flex flex-wrap gap-x-1 gap-y-2">
          <Button asChild variant="outline">
            <Link href={editHref}>
              <Pencil aria-hidden />
              Edit
            </Link>
          </Button>
          {change.everSent ? (
            <Confirm
              trigger="Cancel this change"
              text={`${clientFirstName} will see it as cancelled. Nothing is added to the project.`}
            >
              <Run
                action={cancelChange}
                {...ids}
                label="Cancel change"
                pendingLabel="Cancelling…"
                variant="destructive"
              />
            </Confirm>
          ) : (
            <Confirm
              trigger="Delete draft"
              text="The draft is removed for good."
            >
              <Run
                action={deleteChange}
                {...ids}
                label="Delete draft"
                pendingLabel="Deleting…"
                variant="destructive"
              />
            </Confirm>
          )}
        </div>
      </SideCard>
    );
  }

  return (
    <SideCard>
      {change.status === "sent" && (
        <>
          <SideCardTitle>Waiting for {clientFirstName}</SideCardTitle>
          {change.sentAt && (
            <p className="text-sm text-muted-foreground tabular-nums">
              Sent {formatDateTime(change.sentAt)}
            </p>
          )}
        </>
      )}
      {change.decision && (
        <>
          <SideCardTitle>
            {change.decision.decision === "approved" ? "Approved" : "Declined"}{" "}
            by {change.decision.name}
          </SideCardTitle>
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatDateTime(change.decision.at)}
          </p>
          {change.decision.comment && (
            <blockquote
              className={cn(
                "border-l-2 pl-3 text-[15px] leading-relaxed whitespace-pre-line",
                change.decision.decision === "approved"
                  ? "border-brand"
                  : "border-border",
              )}
            >
              {change.decision.comment}
            </blockquote>
          )}
        </>
      )}
      {change.status === "withdrawn" && (
        <>
          <SideCardTitle>Cancelled</SideCardTitle>
          <SideCardText>Nothing was added to the project.</SideCardText>
        </>
      )}
      {link && change.status !== "withdrawn" && (
        <ShareLink url={link.url} phone={link.phone} message={link.message} />
      )}
      {change.status === "sent" && (
        <Run
          action={withdrawChange}
          {...ids}
          label="Take back to edit"
          pendingLabel="Taking back…"
          variant="outline"
        />
      )}
    </SideCard>
  );
}

function Run({
  action: run,
  projectId,
  number,
  label,
  pendingLabel,
  variant = "default",
  wide,
}: {
  action: Action;
  projectId: string;
  number: number;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "destructive";
  wide?: boolean;
}) {
  const [state, action, pending] = useActionState<ChangeFormState, FormData>(
    run,
    IDLE,
  );
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="number" value={number} />
      <Button
        type="submit"
        variant={variant}
        disabled={pending}
        className={cn(wide && "w-full")}
      >
        {pending ? pendingLabel : label}
      </Button>
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}

function Confirm({
  trigger,
  text,
  children,
}: {
  trigger: string;
  text: string;
  children: React.ReactNode;
}) {
  const panel = useInlinePanel();
  if (!panel.open) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        {...panel.trigger("open")}
      >
        {trigger}
      </Button>
    );
  }
  return (
    <div
      {...panel.panel(trigger)}
      className={cn(
        "grid w-full gap-2 rounded-lg border p-3",
        INLINE_PANEL_FOCUS,
      )}
    >
      <p className="text-sm">{text}</p>
      <div className="flex flex-wrap gap-2">
        {children}
        <Button type="button" variant="ghost" onClick={panel.close}>
          Keep it
        </Button>
      </div>
    </div>
  );
}
