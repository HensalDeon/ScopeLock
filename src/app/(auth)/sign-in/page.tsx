import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  AuthHeading,
  FormSkeleton,
  RedirectIfSignedIn,
  SignInForm,
} from "@/modules/account";
import { isGoogleAuthEnabled } from "@/shared/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <>
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <AuthHeading title="Sign in to ScopeLock" />
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <SignInForm googleEnabled={isGoogleAuthEnabled()} />
      </Suspense>
      <p className="mt-8 text-sm text-muted-foreground">
        New to ScopeLock?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
