import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthHeading, FormSkeleton, prefillEmail } from "@/modules/account";
import { SignUpWithOptions } from "@/modules/account/server";
import { safeNextPath } from "@/shared/auth/redirect";

export const metadata: Metadata = { title: "Create an account" };

/** Signed-in visitors are sent to the app by the proxy before this renders. */
export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  return (
    <>
      <AuthHeading
        title="Create your account"
        description="Free for 2 active projects. No card needed. Next you'll add your business name; clients see it on every approval link and change order."
      />
      <Suspense fallback={<FormSkeleton fields={3} />}>
        <SignUpWithOptions
          email={searchParams.then((p) => prefillEmail(p.email))}
        />
      </Suspense>
      <Suspense>
        <SignInLink next={searchParams.then((p) => p.next)} />
      </Suspense>
    </>
  );
}

/** "Already have an account?": keeps `?next=` so nothing is lost. */
async function SignInLink({
  next,
}: {
  next: Promise<string | string[] | undefined>;
}) {
  const raw = await next;
  const to = typeof raw === "string" ? safeNextPath(raw, "") : "";
  return (
    <p className="mt-8 text-sm text-muted-foreground">
      Already have an account?{" "}
      <Link
        href={
          (to ? `/sign-in?next=${encodeURIComponent(to)}` : "/sign-in") as Route
        }
        className="font-medium text-foreground underline-offset-4 hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
      >
        Sign in
      </Link>
    </p>
  );
}
