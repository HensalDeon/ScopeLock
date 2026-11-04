import { VerifyEmailForm } from "@/modules/account";
import { getSession } from "@/shared/auth/session";

/** Bar shown until the account email is confirmed with the emailed code. */
export async function VerifyEmailBanner() {
  const session = await getSession();
  if (!session || session.user.emailVerified) return null;

  return (
    <div className="border-b border-warning/20 bg-warning-soft px-4 py-3 text-[#7a3d06] sm:px-8">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="min-w-0 flex-1 basis-80 text-sm leading-relaxed">
          Confirm your email so approval and payment notifications reach you.
          Enter the 6-digit code we sent to{" "}
          <strong className="font-medium">{session.user.email}</strong>.
        </p>
        <VerifyEmailForm email={session.user.email} />
      </div>
    </div>
  );
}
