"use client";

import { useActionState, useLayoutEffect, useState } from "react";
import { formatDateTime } from "@/shared/lib/dates";
import { IDLE } from "@/shared/lib/form-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ShareLink } from "@/shared/ui/share-link";
import { SideCard, SideCardText, SideCardTitle } from "@/shared/ui/side-card";
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

  const approved = status !== "awaiting_approval";
  return (
    <SideCard>
      {approved && lastDecision?.decision === "approved" ? (
        <>
          <SideCardTitle>{name}&apos;s link</SideCardTitle>
          <p className="text-sm text-muted-foreground tabular-nums">
            Approved by {lastDecision.name}, {formatDateTime(lastDecision.at)}.
            The link now opens the project page: payments, changes and invoices.
          </p>
          {lastDecision.comment && (
            <blockquote className="border-l-2 border-brand pl-3 text-[15px] leading-relaxed whitespace-pre-line">
              {lastDecision.comment}
            </blockquote>
          )}
        </>
      ) : (
        <>
          <SideCardTitle>Waiting for {name}</SideCardTitle>
          {sentAt && (
            <p className="text-sm text-muted-foreground tabular-nums">
              Sent {formatDateTime(sentAt)}
            </p>
          )}
        </>
      )}

      {url ? (
        <ShareLink
          url={url}
          phone={client.phone}
          message={message}
          primary={!approved}
        />
      ) : (
        <SideCardText>
          This link can&apos;t be shown again because the app&apos;s security
          key changed. Make a new link and share that one.
        </SideCardText>
      )}

      <div className="flex flex-wrap gap-x-1 gap-y-2">
        {!approved && (
          <ActionButton
            action={withdrawProposal}
            projectId={projectId}
            label="Withdraw to edit"
            pendingLabel="Withdrawing…"
            variant="outline"
          />
        )}
        <ReplaceLink projectId={projectId} />
      </div>
    </SideCard>
  );
}

function ReplaceLink({ projectId }: { projectId: string }) {
  const [confirming, setConfirming] = useState(false);
  useLayoutEffect(() => () => setConfirming(false), []);
  if (!confirming) {
    return (
      <Button type="button" variant="ghost" onClick={() => setConfirming(true)}>
        Replace link
      </Button>
    );
  }
  return (
    <div className="grid w-full gap-2 rounded-lg border p-3">
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
        />
        <Button
          type="button"
          variant="ghost"
          onClick={() => setConfirming(false)}
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
}: {
  action: Action;
  projectId: string;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "destructive";
}) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(
    run,
    IDLE,
  );
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="id" value={projectId} />
      <Button
        type="submit"
        variant={variant}
        disabled={pending}
        className={cn(variant === "default" && "w-full")}
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
