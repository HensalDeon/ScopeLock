import type { Metadata } from "next";
import { Suspense } from "react";
import {
  AuthHeading,
  FormSkeleton,
  ResetPasswordForm,
} from "@/modules/account";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading title="Choose a new password" />
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
