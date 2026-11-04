import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthHeading, RedirectIfSignedIn, SignUpForm } from "@/modules/account";
import { isGoogleAuthEnabled } from "@/shared/lib/env";

export const metadata: Metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <>
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <AuthHeading
        title="Create your account"
        description="Next you'll add your business name. Clients see it on every approval link and change order."
      />
      <SignUpForm googleEnabled={isGoogleAuthEnabled()} />
      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
