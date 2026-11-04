import { ResendVerificationButton } from "@/modules/account";
import { getSession } from "@/shared/auth/session";

/** Thin bar shown until the account email is confirmed. */
export async function VerifyEmailBanner() {
  const session = await getSession();
  if (!session || session.user.emailVerified) return null;

  return (
    <div className="border-b border-warning/20 bg-warning-soft px-4 py-2.5 text-sm text-[#7a3d06] sm:px-8">
      Confirm your email so approval and payment notifications reach you. We
      sent a link to{" "}
      <strong className="font-medium">{session.user.email}</strong>.{" "}
      <ResendVerificationButton email={session.user.email} />
    </div>
  );
}
