import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthHeading, FormSkeleton } from "@/modules/account";
import { SignInWithOptions } from "@/modules/account/server";

export const metadata: Metadata = { title: "Sign in" };

/** Signed-in visitors are sent to the app by the proxy before this renders. */
export default function SignInPage() {
  return (
    <>
      <AuthHeading title="Sign in to ScopeLock" />
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <SignInWithOptions />
      </Suspense>
      <p className="mt-8 text-sm text-muted-foreground">
        New to ScopeLock?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-foreground underline-offset-4 hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
