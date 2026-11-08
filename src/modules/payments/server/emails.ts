import type { EmailContent } from "@/shared/email";

type Email = { subject: string; content: EmailContent };

/** To the client: a payment is due, with the link to pay. */
export function paymentDueEmail(input: {
  business: string;
  project: string;
  label: string;
  amount: string;
  lines: string[];
  invoiceNumber: string;
  url: string;
}): Email {
  return {
    subject: `${input.business} has asked for ${input.amount} for ${input.project}`,
    content: {
      preview: `${input.label} · ${input.amount}`,
      heading: `${input.amount} due for ${input.project}`,
      paragraphs: [
        `${input.business} has asked for the ${input.label} payment (invoice ${input.invoiceNumber}).`,
        ...input.lines,
        "Open the link to see how to pay (UPI, bank transfer or a payment link) and to download the invoice. After paying, tap “I've paid” and add the UTR, so it can be confirmed.",
      ],
      action: { label: "See how to pay", url: input.url },
      footnote:
        "You pay the freelancer directly. ScopeLock never holds your money.",
    },
  };
}

/** To the freelancer: the client says they've paid. */
export function paymentReportedEmail(input: {
  client: string;
  project: string;
  label: string;
  amount: string;
  method: string;
  reference: string;
  paidOn: string;
  url: string;
}): Email {
  return {
    subject: `${input.client} says they paid ${input.amount} for ${input.project}`,
    content: {
      preview: `${input.method} · ${input.reference}`,
      heading: "Check and confirm the payment",
      paragraphs: [
        `${input.client} says they paid ${input.amount} for the ${input.label} payment on ${input.paidOn}, by ${input.method}.`,
        `Reference (UTR): ${input.reference}`,
        "Check your bank or UPI app, then mark it received, or say it hasn't arrived.",
      ],
      action: { label: "Check the payment", url: input.url },
    },
  };
}

/** To the client: the freelancer received it. */
export function paymentConfirmedEmail(input: {
  business: string;
  project: string;
  label: string;
  amount: string;
  url: string;
}): Email {
  return {
    subject: `${input.business} received your payment of ${input.amount}`,
    content: {
      preview: `${input.label} · ${input.project}`,
      heading: "Payment received",
      paragraphs: [
        `${input.business} confirmed they received ${input.amount} for the ${input.label} payment on ${input.project}. Thank you.`,
      ],
      action: { label: "Open the project", url: input.url },
    },
  };
}

/** To the client: the freelancer hasn't received it yet. */
export function paymentNotReceivedEmail(input: {
  business: string;
  project: string;
  label: string;
  amount: string;
  note: string;
  url: string;
}): Email {
  return {
    subject: `${input.business} hasn't received ${input.amount} yet`,
    content: {
      preview: input.note,
      heading: "Payment not received yet",
      paragraphs: [
        `${input.business} checked and hasn't received the ${input.label} payment (${input.amount}) for ${input.project} yet.`,
        `Their note: “${input.note}”`,
        "Please check your bank or UPI app. If it went through, add the right UTR on the payment page.",
      ],
      action: { label: "Open the payment", url: input.url },
    },
  };
}
