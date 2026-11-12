import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/modules/account";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <ForgotPasswordForm />
      <p className="mt-8 text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
