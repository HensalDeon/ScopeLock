import { type Minor } from "@/shared/lib/money";
import { type BillingOption, type ChangeRequest } from "./change-request";

/** Form values: what the change request form starts from. */

/** The form's values as typed: amounts are text, ids optional. */
export type ChangeFormValues = {
  title: string;
  description: string;
  items: { id?: string; title: string; description: string; amount: string }[];
  billingOption: BillingOption;
  milestoneId: string;
  sourceChannel: string;
  sourceNote: string;
};

/** Minor units → the text a person would type ("15000", "1499.5"). */
const amountText = (amount: Minor) => String(amount / 100);

/** A new, empty CR. Upfront projects default to a separate payment. */
export function blankChangeValues(
  billingModel: "upfront" | "milestones",
): ChangeFormValues {
  return {
    title: "",
    description: "",
    items: [],
    billingOption: billingModel === "upfront" ? "pay_now" : "final",
    milestoneId: "",
    sourceChannel: "",
    sourceNote: "",
  };
}

/** "Turn into a change request" from a proposal add-on. */
export function changeValuesFromAddon(
  addon: {
    title: string;
    description: string | null;
    amount: Minor;
    unit: string | null;
  },
  billingModel: "upfront" | "milestones",
): ChangeFormValues {
  return {
    ...blankChangeValues(billingModel),
    title: addon.title,
    description: addon.description ?? "",
    items: [
      {
        // "/ page" → "Extra page (per page)": the client sees what one unit is.
        title: addon.unit
          ? `${addon.title} (${addon.unit.replace(/^\/\s*/, "per ")})`
          : addon.title,
        description: "",
        amount: amountText(addon.amount),
      },
    ],
  };
}

/**
 * An existing CR as form values: to edit it (keeps line ids), or to start a
 * revised one from a declined or cancelled CR (`revise`: new lines).
 */
export function changeValuesFrom(
  change: Pick<
    ChangeRequest,
    "title" | "description" | "items" | "billing" | "source"
  >,
  { revise = false } = {},
): ChangeFormValues {
  return {
    title: change.title,
    description: change.description ?? "",
    items: change.items.map((item) => ({
      ...(revise ? {} : { id: item.id }),
      title: item.title,
      description: item.description ?? "",
      amount: amountText(item.amount),
    })),
    billingOption: change.billing.option,
    milestoneId: change.billing.milestoneId ?? "",
    sourceChannel: change.source?.channel ?? "",
    sourceNote: change.source?.note ?? "",
  };
}

/** The WhatsApp text that goes before a CR's link. */
export function changeShareMessage(input: {
  clientFirstName: string;
  projectName: string;
  title: string;
  /** Formatted, e.g. "₹15,000". */
  total: string;
}): string {
  return `Hi ${input.clientFirstName}, here's a change request for ${input.projectName}: ${input.title} (${input.total}). You can approve or decline it here:`;
}
