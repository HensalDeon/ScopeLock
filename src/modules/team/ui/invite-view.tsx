import type { Route } from "next";
import Link from "next/link";
import { SignOutButton, VerifyEmailForm } from "@/modules/account";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { ROLE_LABELS } from "../domain/team";
import type { InvitePage } from "../server/queries";
import { AcceptButton } from "./accept-button";

const LINK =
  "font-medium underline underline-offset-4 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center";

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
      {children}
    </h1>
  );
}

/**
 * /invite/<token>: who invited you to what, and the one next step for
 * whoever is looking (make an account, sign in as the right email, confirm
 * the email, or join).
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
        <p className="text-[15px] text-pretty text-muted-foreground">
          It may have been copied only in part. Ask whoever invited you to send
          it again from ScopeLock.
        </p>
      </div>
    );
  if (page.kind !== "open")
    return (
      <div className="grid gap-3">
        <Heading>
          {page.kind === "used"
            ? "This invite has been used"
            : page.kind === "expired"
              ? "This invite has expired"
              : "This invite was cancelled"}
        </Heading>
        <p className="text-[15px] text-pretty text-muted-foreground">
          {page.kind === "used"
            ? `If it was you, open ScopeLock to work in ${page.business}.`
            : `Invites work for 7 days. Ask ${page.business} to send you a new one.`}
        </p>
        {page.kind === "used" && (
          <div>
            <Button asChild className={TOUCH}>
              <Link href="/dashboard">Open ScopeLock</Link>
            </Button>
          </div>
        )}
      </div>
    );

  const role = page.role === "admin" ? "an admin" : "a member";
  const intro = (
    <>
      <Heading>Join {page.business} on ScopeLock</Heading>
      <p className="text-[15px] text-pretty text-muted-foreground">
        {page.inviter} invited you as {role}. {ROLE_LABELS[page.role].detail}
      </p>
    </>
  );
  const v = page.viewer;
  return (
    <div className="grid gap-4">
      {intro}
      {v.kind === "signed_out" && (
        <div className="grid gap-3">
          <Button asChild className={TOUCH}>
            <Link
              href={
                `/sign-up?email=${encodeURIComponent(page.email)}&next=${encodeURIComponent(back)}` as Route
              }
            >
              Create your account
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Already use ScopeLock with {page.email}?{" "}
            <Link
              href={`/sign-in?next=${encodeURIComponent(back)}` as Route}
              className={LINK}
            >
              Sign in
            </Link>
          </p>
        </div>
      )}
      {v.kind === "other_email" && (
        <div className="grid justify-items-start gap-3">
          <p className="text-sm text-pretty">
            You&apos;re signed in as{" "}
            <strong className="font-medium">{v.email}</strong>, but this invite
            is for <strong className="font-medium">{page.email}</strong>. Sign
            out, then open this link again and sign in with that email.
          </p>
          <SignOutButton />
        </div>
      )}
      {v.kind === "unverified" && (
        <div className="grid gap-3">
          <p className="text-sm text-pretty">
            First, confirm your email: enter the 6-digit code we sent to{" "}
            <strong className="font-medium">{v.email}</strong>.
          </p>
          <VerifyEmailForm email={v.email} />
        </div>
      )}
      {(v.kind === "ready" || v.kind === "member") &&
        (page.full && v.kind === "ready" ? (
          <p className="text-sm text-pretty">
            {page.business}&apos;s plan has no place left right now. Ask{" "}
            {page.inviter} to make room, then open this link again.
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
    </div>
  );
}
