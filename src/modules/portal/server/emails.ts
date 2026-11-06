import type { EmailContent } from "@/shared/email";
import { formatDateTime } from "@/shared/lib/dates";

/** To the freelancer, when the client answers. */
export function decisionEmail(input: {
  decision: "approved" | "rejected";
  projectTitle: string;
  reference: string;
  total: string;
  clientName: string;
  clientEmail: string;
  comment: string | null;
  at: Date;
  projectUrl: string;
}): { subject: string; content: EmailContent } {
  const when = formatDateTime(input.at);
  const who = `${input.clientName} (${input.clientEmail})`;
  if (input.decision === "approved") {
    return {
      subject: `${input.clientName} approved ${input.projectTitle}`,
      content: {
        preview: `${input.total} · ${input.reference} · ${when}`,
        heading: `${input.projectTitle} is approved`,
        paragraphs: [
          `${who} approved proposal ${input.reference} for ${input.total} on ${when}.`,
          "The scope is now locked. Anything extra they ask for from here becomes a change request with its own price.",
          ...(input.comment ? [`Their note: “${input.comment}”`] : []),
        ],
        action: { label: "Open the project", url: input.projectUrl },
        footnote:
          "ScopeLock keeps a signed record of exactly what was approved, with the time, name and email.",
      },
    };
  }
  return {
    subject: `${input.clientName} asked for changes to ${input.projectTitle}`,
    content: {
      preview: input.comment ?? `${input.reference} · ${when}`,
      heading: "Changes requested",
      paragraphs: [
        `${who} asked for changes to proposal ${input.reference} on ${when}.`,
        ...(input.comment ? [`What they said: “${input.comment}”`] : []),
        "The project is back in draft. Edit the scope, then send it again. Your client keeps the same link.",
      ],
      action: { label: "Edit the proposal", url: input.projectUrl },
    },
  };
}

/** To the freelancer, when the client answers a change request. */
export function changeDecisionEmail(input: {
  decision: "approved" | "rejected";
  label: string;
  title: string;
  projectTitle: string;
  total: string;
  billing: string;
  clientName: string;
  clientEmail: string;
  comment: string | null;
  at: Date;
  url: string;
}): { subject: string; content: EmailContent } {
  const when = formatDateTime(input.at);
  const who = `${input.clientName} (${input.clientEmail})`;
  const what = `${input.label} ${input.title}`;
  if (input.decision === "approved") {
    return {
      subject: `${input.clientName} approved ${input.label}: ${input.title}`,
      content: {
        preview: `${input.total} · ${input.projectTitle} · ${when}`,
        heading: `${input.label} is approved`,
        paragraphs: [
          `${who} approved ${what} for ${input.total} on ${when}.`,
          input.billing,
          ...(input.comment ? [`Their note: “${input.comment}”`] : []),
        ],
        action: { label: "Open the change request", url: input.url },
        footnote:
          "ScopeLock keeps a signed record of exactly what was approved, with the time, name and email.",
      },
    };
  }
  return {
    subject: `${input.clientName} declined ${input.label}: ${input.title}`,
    content: {
      preview: input.comment ?? `${input.projectTitle} · ${when}`,
      heading: `${input.label} was declined`,
      paragraphs: [
        `${who} declined ${what} (${input.total}) on ${when}.`,
        ...(input.comment ? [`What they said: “${input.comment}”`] : []),
        "Nothing was added to the project. You can send a new change request with a different price or scope.",
      ],
      action: { label: "Open the change request", url: input.url },
    },
  };
}
