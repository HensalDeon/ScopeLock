import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading, ForgotPasswordForm } from "@/modules/account";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        title="Reset your password"
        description="Enter the email you signed up with and we'll send you a link to choose a new password."
      />
      <ForgotPasswordForm />
      <p className="mt-8 text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
