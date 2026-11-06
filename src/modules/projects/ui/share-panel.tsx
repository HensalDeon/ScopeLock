"use client";

import { Check, Copy, MessageCircle } from "lucide-react";
import {
  useActionState,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
} from "react";
import { formatDateTime } from "@/shared/lib/dates";
import { IDLE } from "@/shared/lib/form-state";
import { whatsappLink } from "@/shared/lib/phone";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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
      <Card>
        {changes ? (
          <>
            <Title>{name} asked for changes</Title>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatDateTime(changes.at)}
            </p>
            {changes.comment && (
              <blockquote className="border-l-2 border-warning pl-3 text-[15px] leading-relaxed whitespace-pre-line">
                {changes.comment}
              </blockquote>
            )}
            <Body>
              Edit the scope, then send it again. {name} keeps the same link.
            </Body>
          </>
        ) : (
          <>
            <Title>
              {hasLink ? "Send the updated proposal" : `Send to ${name}`}
            </Title>
            <Body>
              {hasLink
                ? `${name} keeps the same link. It will show this new version.`
                : `This freezes the proposal as it is now and makes a private link for ${name}. Share it on WhatsApp or by email.`}
            </Body>
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
      </Card>
    );
  }

  const approved = status !== "awaiting_approval";
  return (
    <Card>
      {approved && lastDecision?.decision === "approved" ? (
        <>
          <Title>Approved by {lastDecision.name}</Title>
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatDateTime(lastDecision.at)}
          </p>
          {lastDecision.comment && (
            <blockquote className="border-l-2 border-brand pl-3 text-[15px] leading-relaxed whitespace-pre-line">
              {lastDecision.comment}
            </blockquote>
          )}
        </>
      ) : (
        <>
          <Title>Waiting for {name}</Title>
          {sentAt && (
            <p className="text-sm text-muted-foreground tabular-nums">
              Sent {formatDateTime(sentAt)}
            </p>
          )}
        </>
      )}

      {url ? (
        <LinkTools url={url} phone={client.phone} message={message} />
      ) : (
        <Body>
          This link can&apos;t be shown again because the app&apos;s security
          key changed. Make a new link and share that one.
        </Body>
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
    </Card>
  );
}

function LinkTools({
  url,
  phone,
  message,
}: {
  url: string;
  phone: string | null;
  message: string;
}) {
  const uid = useId();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const text = `${message} ${url}`;
  const whatsapp = phone
    ? whatsappLink(phone, text)
    : `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <div className="grid gap-2">
      <label htmlFor={`${uid}-link`} className="sr-only">
        Client link
      </label>
      <Input
        id={`${uid}-link`}
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="font-mono text-xs"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
            } catch {
              document.getElementById(`${uid}-link`)?.focus();
            }
          }}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button asChild>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            WhatsApp
          </a>
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </p>
    </div>
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-xl border bg-canvas p-5">{children}</div>
  );
}
function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold">{children}</h2>;
}
function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
      {children}
    </p>
  );
}
