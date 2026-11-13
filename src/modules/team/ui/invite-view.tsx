import type { Route } from "next";
import Link from "next/link";
import { SignOutButton } from "@/modules/account";
import { Button } from "@/shared/ui/button";
import { formatDate } from "@/shared/lib/dates";
import { TOUCH } from "@/shared/ui/touch";
import { ROLE_LABELS } from "../domain/team";
import type { InvitePage } from "../server/queries";
import { AcceptButton } from "./accept-button";

const LINK = "font-medium underline underline-offset-4";

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
      {children}
    </h1>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[15px] text-pretty text-muted-foreground">{children}</p>
  );
}

/**
 * /invite/<token>: who invited you to what, and the one next step for
 * whoever is looking (make an account, sign in as the right email, or
 * join). Opening the emailed link confirms the email.
 */
export function InviteView({
  page,
  token,
}: {
  page: InvitePage;
  token: string;
}) {
  const back = `/invite/${token}`;
  if (page.kind === "invalid")
    return (
      <div className="grid gap-3">
        <Heading>This invite link doesn&apos;t work</Heading>
        <Lead>
          If you were sent the invite more than once, use the newest email:
          sending it again replaces the old link. Otherwise ask whoever invited
          you to send it again from ScopeLock.
        </Lead>
      </div>
    );
  if (page.kind === "used")
    return (
      <div className="grid gap-3">
        <Heading>This invite has been used</Heading>
        <Lead>If it was you, open ScopeLock to work in {page.business}.</Lead>
        <div>
          <Button asChild className={TOUCH}>
            <Link href="/dashboard">Open ScopeLock</Link>
          </Button>
        </div>
      </div>
    );
  if (page.kind !== "open")
    return (
      <div className="grid gap-3">
        <Heading>
          {page.kind === "expired"
            ? "This invite has expired"
            : "This invite was cancelled"}
        </Heading>
        <Lead>
          {page.kind === "expired"
            ? `Invite links work for 7 days. Ask ${page.inviter} at ${page.business} for a new one.`
            : `${page.inviter} cancelled it. If you still need to join ${page.business}, ask them for a new invite.`}
        </Lead>
      </div>
    );

  const role = page.role === "admin" ? "an admin" : "a member";
  const v = page.viewer;
  return (
    <div className="grid gap-4">
      <Heading>Join {page.business} on ScopeLock</Heading>
      <Lead>
        {page.inviter} invited you as {role}. {ROLE_LABELS[page.role].detail}
      </Lead>
      {v.kind === "signed_out" && (
        <div className="grid gap-3">
          <Button asChild className={TOUCH}>
            <Link href={`${back}/sign-up` as Route}>Create your account</Link>
          </Button>
          <p className="text-sm text-pretty text-muted-foreground">
            Already use ScopeLock as {page.email}?
          </p>
          <Button asChild variant="outline" className={TOUCH}>
            <Link href={`/sign-in?next=${encodeURIComponent(back)}` as Route}>
              Sign in to join
            </Link>
          </Button>
        </div>
      )}
      {v.kind === "other_email" && (
        <div className="grid justify-items-start gap-3">
          <p className="text-sm text-pretty">
            You&apos;re signed in as{" "}
            <strong className="font-medium">{v.email}</strong>, but this invite
            is for <strong className="font-medium">{page.email}</strong>. Sign
            out, then sign in or make an account with that email.
          </p>
          <SignOutButton variant="outline" then={back} />
        </div>
      )}
      {(v.kind === "ready" || v.kind === "member") &&
        (page.full && v.kind === "ready" ? (
          <p className="text-sm text-pretty">
            {page.solo
              ? `${page.business}'s plan is for one person right now. Ask ${page.inviter} to move to a plan with a team, then open this link again.`
              : `${page.business} has no place left on its plan right now. Ask ${page.inviter} to make room, then open this link again.`}
          </p>
        ) : (
          <AcceptButton
            token={token}
            label={
              v.kind === "member"
                ? `Open ${page.business}`
                : `Join ${page.business}`
            }
          />
        ))}
      {v.kind === "signed_out" && (
        <p className="text-[13px] text-pretty text-muted-foreground">
          This link works once, until {formatDate(page.expiresAt)}.{" "}
          <Link href="/" className={LINK}>
            What is ScopeLock?
          </Link>
        </p>
      )}
    </div>
  );
}
