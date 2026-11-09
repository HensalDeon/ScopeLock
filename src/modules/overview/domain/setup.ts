import type { OverviewProject } from "./overview";

/** The first-run checklist on the overview. */

export type SetupStep = {
  title: string;
  detail: string;
  done: boolean;
  href?: string;
};

export function setupSteps(input: {
  businessName: string;
  businessTypeTitle: string;
  clientCount: number;
  /** A UPI ID, bank account, payment link or QR is saved. */
  paymentsReady: boolean;
  /** Invoice details saved (legal name, address or GSTIN). */
  invoicingReady: boolean;
  projects: readonly Pick<OverviewProject, "id" | "status" | "changeCount">[];
}): SetupStep[] {
  const { projects } = input;
  const approved = projects.find(
    (p) => p.status === "active" || p.status === "completed",
  );
  return [
    {
      title: "Set up your workspace",
      detail: `${input.businessName} · ${input.businessTypeTitle}`,
      done: true,
    },
    {
      title: "Add your first client",
      detail: "Their name, company and WhatsApp number.",
      done: input.clientCount > 0,
      href: "/clients/new",
    },
    {
      title: "Add how you get paid",
      detail:
        "UPI ID, bank account or a payment link, so clients know where to pay.",
      done: input.paymentsReady,
      href: "/settings/payments",
    },
    {
      title: "Add your invoice details",
      detail:
        "Your legal name and address, and your GSTIN if you're registered for GST. Do it before your first invoice: issued invoices can't be changed.",
      done: input.invoicingReady,
      href: "/settings/invoicing",
    },
    {
      title: "Write down a project's scope",
      detail: "List what's included, the price, and how the client pays.",
      done: projects.length > 0,
      href: "/projects/new",
    },
    {
      title: "Get the scope approved",
      detail:
        "Send it to your client. Once they approve, it's locked as the baseline.",
      done: Boolean(approved),
    },
    {
      title: "Log extra requests as they come in",
      detail:
        "Each one becomes a priced change request your client approves before you start.",
      done: projects.some((p) => p.changeCount > 0),
      href: approved ? `/projects/${approved.id}/changes/new` : undefined,
    },
  ];
}
