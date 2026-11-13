import type { EmailContent } from "@/shared/email";
import { INVITE_TTL_DAYS } from "./invitation";
import { ROLE_LABELS, type InviteRole } from "./team";

/** To the person invited: who invited them, to what, and the link. */
export function inviteEmail(input: {
  business: string;
  inviter: string;
  role: InviteRole;
  url: string;
}): { subject: string; content: EmailContent } {
  const role = ROLE_LABELS[input.role].title.toLowerCase();
  return {
    subject: `${input.inviter} invited you to ${input.business} on ScopeLock`,
    content: {
      preview: `Join as ${role === "admin" ? "an admin" : "a member"}`,
      heading: `Join ${input.business} on ScopeLock`,
      paragraphs: [
        `${input.inviter} invited you to work in ${input.business}'s ScopeLock as ${role === "admin" ? "an admin" : "a member"}: proposals, change requests and payments for their clients.`,
        "Open the link to join. If you don't have a ScopeLock account yet, you'll make one with this email address.",
      ],
      action: { label: "Accept the invite", url: input.url },
      footnote: `The link works once and expires in ${INVITE_TTL_DAYS} days. Not expecting this? You can ignore it.`,
    },
  };
}
