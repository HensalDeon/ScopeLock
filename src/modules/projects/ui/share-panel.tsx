"use client";

import { useActionState, useEffect, useRef } from "react";
import { formatDateTime } from "@/shared/lib/dates";
import { IDLE } from "@/shared/lib/form-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { ShareLink } from "@/shared/ui/share-link";
import { SideCard, SideCardText, SideCardTitle } from "@/shared/ui/side-card";
import {
  INLINE_PANEL_FOCUS,
  useInlinePanel,
} from "@/shared/ui/use-inline-panel";
import type { ProjectDecision, ProjectStatus } from "../domain/project";
import {
  regeneratePortalLink,
  sendProposal,
  withdrawProposal,
  type ProjectFormState,
} from "../server/actions";

type Action = (s: ProjectFormState, d: FormData) => Promise<ProjectFormState>;

/**
 * Sending the proposal and sharing its link. One card that follows the
 * project: send → waiting (copy / WhatsApp / withdraw) → approved.
 */
export function SharePanel({
  projectId,
  status,
  url,
  hasLink,
  sentAt,
  lastDecision,
  emailVerified,
  client,
  message,
}: {
  projectId: string;
  status: ProjectStatus;
  url: string | null;
  hasLink: boolean;
  sentAt: Date | null;
  lastDecision: ProjectDecision | null;
  emailVerified: boolean;
  client: { firstName: string; phone: string | null };
  /** WhatsApp text without the link, e.g. "Hi Rahul, here's the proposal…". */
  message: string;
}) {
  const name = client.firstName;

  if (status === "draft") {
    const changes =
      lastDecision?.decision === "rejected" &&
      sentAt &&
      lastDecision.at >= sentAt
        ? lastDecision
        : null;
    return (
      <SideCard>
        {changes ? (
          <>
            <SideCardTitle>{name} asked for changes</SideCardTitle>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatDateTime(changes.at)}
            </p>
            {changes.comment && (
              <blockquote className="border-l-2 border-warning pl-3 text-[15px] leading-relaxed whitespace-pre-line">
                {changes.comment}
              </blockquote>
            )}
            <SideCardText>
              Edit the scope, then send it again. {name} keeps the same link.
            </SideCardText>
          </>
        ) : (
          <>
            <SideCardTitle>
              {hasLink ? "Send the updated proposal" : `Send to ${name}`}
            </SideCardTitle>
            <SideCardText>
              {hasLink
                ? `${name} keeps the same link. It will show this new version.`
                : `This freezes the proposal as it is now and makes a private link for ${name}. Share it on WhatsApp or by email.`}
            </SideCardText>
          </>
        )}
        {!emailVerified && (
          <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-warning-ink">
            Confirm your email first, with the code from the banner at the top.
            Your email appears on the proposal.
          </p>
        )}
        <ActionButton
          action={sendProposal}
          projectId={projectId}
          label={hasLink ? "Send updated proposal" : "Send for approval"}
          pendingLabel="Sending…"
        />
      </SideCard>
    );
  }

  if (status !== "awaiting_approval") {
    // Approved: the link is a utility now (the project page for the client),
    // so the card shrinks to it. The approval itself lives in Client answers.
    return (
      <SideCard>
        <div className="grid gap-1">
          <SideCardTitle>{name}&apos;s link</SideCardTitle>
          <SideCardText>
            Opens {name}&apos;s project page: payments, changes and invoices.
          </SideCardText>
        </div>
        {url ? (
          <ShareLink
            url={url}
            phone={client.phone}
            message={message}
            primary={false}
            compact
          />
        ) : (
          <SideCardText>
            This link can&apos;t be shown again because the app&apos;s security
            key changed. Make a new link and share that one.
          </SideCardText>
        )}
        <ReplaceLink projectId={projectId} />
      </SideCard>
    );
  }

  return (
    <SideCard>
      <SideCardTitle>Waiting for {name}</SideCardTitle>
      {sentAt && (
        <p className="text-sm text-muted-foreground tabular-nums">
          Sent {formatDateTime(sentAt)}
        </p>
      )}
      {url ? (
        <ShareLink url={url} phone={client.phone} message={message} />
      ) : (
        <SideCardText>
          This link can&apos;t be shown again because the app&apos;s security
          key changed. Make a new link and share that one.
        </SideCardText>
      )}
      <div className="flex flex-wrap gap-x-1 gap-y-2">
        <ActionButton
          action={withdrawProposal}
          projectId={projectId}
          label="Withdraw to edit"
          pendingLabel="Withdrawing…"
          variant="outline"
        />
        <ReplaceLink projectId={projectId} />
      </div>
    </SideCard>
  );
}

function ReplaceLink({ projectId }: { projectId: string }) {
  const panel = useInlinePanel();
  if (!panel.open) {
    return (
      <Button
        type="button"
        variant="ghost"
        className={cn("justify-self-start", TOUCH)}
        {...panel.trigger("open")}
      >
        Replace link
      </Button>
    );
  }
  return (
    <div
      {...panel.panel("Replace the client link")}
      className={cn(
        "grid w-full gap-2 rounded-lg border p-3",
        INLINE_PANEL_FOCUS,
      )}
    >
      <p className="text-sm">
        The current link stops working at once. Use this if it went to the wrong
        person.
      </p>
      <div className="flex flex-wrap gap-2">
        <ActionButton
          action={regeneratePortalLink}
          projectId={projectId}
          label="Make a new link"
          pendingLabel="Making link…"
          variant="destructive"
          onSuccess={panel.close}
        />
        <Button
          type="button"
          variant="ghost"
          className={TOUCH}
          onClick={panel.close}
        >
          Keep current link
        </Button>
      </div>
    </div>
  );
}

function ActionButton({
  action: run,
  projectId,
  label,
  pendingLabel,
  variant = "default",
  onSuccess,
}: {
  action: Action;
  projectId: string;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "destructive";
  /** Runs once per successful submit (e.g. close the panel it sits in). */
  onSuccess?: () => void;
}) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(
    run,
    IDLE,
  );
  const handled = useRef(state);
  useEffect(() => {
    if (state.status !== "success" || handled.current === state) return;
    handled.current = state;
    onSuccess?.();
  }, [state, onSuccess]);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="id" value={projectId} />
      <Button
        type="submit"
        variant={variant}
        disabled={pending}
        className={cn(variant === "default" && "w-full", TOUCH)}
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
