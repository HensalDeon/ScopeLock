import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthHeading, FormSkeleton } from "@/modules/account";
import { SignUpWithOptions } from "@/modules/account/server";

export const metadata: Metadata = { title: "Create an account" };

/** Signed-in visitors are sent to the app by the proxy before this renders. */
export default function SignUpPage() {
  return (
    <>
      <AuthHeading
        title="Create your account"
        description="Next you'll add your business name. Clients see it on every approval link and change order."
      />
      <Suspense fallback={<FormSkeleton fields={3} />}>
        <SignUpWithOptions />
      </Suspense>
      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
