import type { EmailContent } from "./layout";

/** Account emails. Short, plain, and specific — like a person wrote them. */

export function verifyEmailTemplate(name: string, url: string): EmailContent {
  return {
    preview: "One click and your account is confirmed.",
    heading: "Confirm your email",
    paragraphs: [
      `Hi ${firstName(name)},`,
      "Please confirm this is your email address. We'll use it for approval and payment notifications, so it needs to reach you.",
    ],
    action: { label: "Confirm email", url },
    footnote:
      "This link works for 1 hour. If you didn't create a ScopeLock account, you can ignore this email.",
  };
}

export function resetPasswordTemplate(name: string, url: string): EmailContent {
  return {
    preview: "Use this link to choose a new password.",
    heading: "Reset your password",
    paragraphs: [
      `Hi ${firstName(name)},`,
      "Someone asked to reset the password for your ScopeLock account. If that was you, choose a new one below.",
    ],
    action: { label: "Choose a new password", url },
    footnote:
      "This link works for 1 hour. If you didn't ask for this, your password hasn't changed and you can ignore this email.",
  };
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}
