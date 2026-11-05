import { CODE_TTL_MINUTES } from "@/shared/auth/policy";
import type { EmailContent } from "./layout";

/** Account emails. Short, plain, and specific — like a person wrote them. */

export type CodePurpose =
  "email-verification" | "forget-password" | "sign-in" | "change-email";

const NEVER_SHARE =
  "Never share this code. ScopeLock will never call or message you to ask for it.";

/**
 * The email that carries a one-time code. The code goes in the subject too,
 * so it can be read straight from the phone notification.
 */
export function codeEmail(
  purpose: CodePurpose,
  code: string,
): { subject: string; content: EmailContent } {
  const expiry = `The code works for ${CODE_TTL_MINUTES} minutes.`;

  if (purpose === "forget-password") {
    return {
      subject: `${code} is your ScopeLock password reset code`,
      content: {
        preview: `Enter it on the reset page. It works for ${CODE_TTL_MINUTES} minutes.`,
        heading: "Reset your password",
        paragraphs: [
          "Someone asked to reset the password for the ScopeLock account on this email. If that was you, enter this code on the reset page.",
        ],
        code,
        footnote: `${expiry} If you didn't ask for this, your password hasn't changed and you can ignore this email. ${NEVER_SHARE}`,
      },
    };
  }

  if (purpose === "email-verification") {
    return {
      subject: `${code} is your ScopeLock confirmation code`,
      content: {
        preview: `Enter it in ScopeLock to confirm your email. It works for ${CODE_TTL_MINUTES} minutes.`,
        heading: "Confirm your email",
        paragraphs: [
          "Enter this code in ScopeLock to confirm your email address. We'll send approval and payment notifications here, so it needs to reach you.",
        ],
        code,
        footnote: `${expiry} If you didn't create a ScopeLock account, you can ignore this email. ${NEVER_SHARE}`,
      },
    };
  }

  return {
    subject: `${code} is your ScopeLock code`,
    content: {
      preview: `It works for ${CODE_TTL_MINUTES} minutes.`,
      heading: "Your ScopeLock code",
      paragraphs: ["Enter this code in ScopeLock to continue."],
      code,
      footnote: `${expiry} If you didn't ask for this, you can ignore this email. ${NEVER_SHARE}`,
    },
  };
}
