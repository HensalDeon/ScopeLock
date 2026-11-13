import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthHeading, FormSkeleton } from "@/modules/account";
import { SignUpWithOptions } from "@/modules/account/server";
import { getInvitePage } from "@/modules/team/server";

export const metadata: Metadata = {
  title: "Create your account",
  robots: { index: false, follow: false },
};

/**
 * Making an account from a team invite: says what it's for (joining the
 * team, nothing to set up), uses the invited email, and comes back to the
 * invite to join.
 */
export default function InviteSignUpPage({
  params,
}: PageProps<"/invite/[token]/sign-up">) {
  return (
    <Suspense fallback={<FormSkeleton fields={3} />}>
      <InviteSignUp params={params} />
    </Suspense>
  );
}

async function InviteSignUp({
  params,
}: {
  params: PageProps<"/invite/[token]/sign-up">["params"];
}) {
  const { token } = await params;
  const back = `/invite/${token}`;
  const page = await getInvitePage(token);
  if (page.kind !== "open" || page.viewer.kind !== "signed_out")
    redirect(back as Route);
  return (
    <>
      <AuthHeading
        title={`Create your account to join ${page.business}`}
        description={`${page.inviter} invited you as ${page.role === "admin" ? "an admin" : "a member"}. You'll go straight into ${page.business}; there's nothing to set up.`}
      />
      <SignUpWithOptions email={page.email} next={back} />
      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/sign-in?next=${encodeURIComponent(back)}` as Route}
          className="font-medium text-foreground underline-offset-4 hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
        >
          Sign in to join
        </Link>
      </p>
    </>
  );
}
