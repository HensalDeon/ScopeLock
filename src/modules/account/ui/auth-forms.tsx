import "server-only";
import { connection } from "next/server";
import { isGoogleAuthEnabled } from "@/shared/lib/env";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

/*
 * Whether "Continue with Google" shows depends on env vars. Reading them at
 * request time (after connection()) instead of during the static prerender
 * means turning Google sign-in on or off needs a restart, not a rebuild, and
 * `next build` doesn't need runtime secrets. Render inside <Suspense>.
 */

export async function SignInWithOptions() {
  await connection();
  return <SignInForm googleEnabled={isGoogleAuthEnabled()} />;
}

export async function SignUpWithOptions({
  email,
  next,
}: {
  /** From `/sign-up?email=…` (the landing page's form), or a team invite. */
  email?: Promise<string> | string;
  /** Where to go after (a team invite); otherwise onboarding. */
  next?: string;
}) {
  await connection();
  return (
    <SignUpForm
      googleEnabled={isGoogleAuthEnabled()}
      defaultEmail={(await email) ?? ""}
      next={next}
    />
  );
}
