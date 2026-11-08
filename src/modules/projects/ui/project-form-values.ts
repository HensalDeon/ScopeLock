import { clientLabel, type Client } from "@/modules/clients";
import type { ProposalDefaults } from "@/modules/documents";
import type { CurrencyCode } from "@/shared/lib/currency";
import { toMajor } from "@/shared/lib/money";
import { joinLines } from "@/shared/lib/text-lines";
import type { Project } from "../domain/project";
import { EMPTY_PROPOSAL } from "../domain/proposal";
import type { ClientOption, ProjectFormDefaults } from "./project-form";
import {
  indiaDatePlusDays,
  proposalFormDefaults,
} from "./proposal-form-defaults";

type ClientRow = Pick<Client, "id" | "name" | "company" | "currency">;

/** How long a new proposal's prices hold by default. */
const VALID_FOR_DAYS = 14;

/**
 * The client picker. On an existing project, its client stays selectable
 * even if archived since (marked as such).
 */
export function clientOptions(
  clients: readonly ClientRow[],
  current?: { clientId: string; client: ClientRow | null },
): ClientOption[] {
  const options = clients.map((c) => ({
    id: c.id,
    label: clientLabel(c),
    currency: c.currency,
  }));
  if (current?.client && !options.some((o) => o.id === current.clientId)) {
    options.push({
      id: current.clientId,
      label: `${clientLabel(current.client)} (archived)`,
      currency: current.client.currency,
    });
  }
  return options;
}

/**
 * A new project: the client from the link (?client=) or the only client,
 * their currency (else the workspace's), and the workspace's default text.
 */
export function newProjectValues(input: {
  clients: readonly ClientRow[];
  requestedClientId: unknown;
  workspaceCurrency: CurrencyCode;
  proposalDefaults: ProposalDefaults;
}): ProjectFormDefaults {
  const { clients } = input;
  const clientId =
    typeof input.requestedClientId === "string" &&
    clients.some((c) => c.id === input.requestedClientId)
      ? input.requestedClientId
      : clients.length === 1
        ? (clients[0]?.id ?? "")
        : "";
  return {
    clientId,
    currency:
      clients.find((c) => c.id === clientId)?.currency ??
      input.workspaceCurrency,
    name: "",
    description: "",
    items: [],
    billingModel: "milestones",
    milestones: [],
    proposal: proposalFormDefaults({
      ...EMPTY_PROPOSAL,
      ...input.proposalDefaults,
      validUntil: indiaDatePlusDays(VALID_FOR_DAYS),
    }),
  };
}

/**
 * A saved draft as form values. Proposals never saved (older projects)
 * start from the workspace's default text, like a new project.
 */
export function projectFormValues(
  project: Project,
  proposalDefaults: ProposalDefaults,
): ProjectFormDefaults {
  return {
    clientId: project.clientId,
    currency: project.currency,
    name: project.name,
    description: project.description ?? "",
    items: project.baseline.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description ?? "",
      includes: joinLines(item.includes),
      amount: String(toMajor(item.amount)),
    })),
    billingModel: project.billingModel,
    milestones: project.milestones.map((m) => ({
      id: m.id,
      name: m.name,
      percent: String(m.percent),
    })),
    proposal: proposalFormDefaults(
      project.proposalSaved
        ? project.proposal
        : {
            ...project.proposal,
            ...proposalDefaults,
            validUntil: indiaDatePlusDays(VALID_FOR_DAYS),
          },
    ),
  };
}
