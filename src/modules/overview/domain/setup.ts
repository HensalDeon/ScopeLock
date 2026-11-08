import type { OverviewProject } from "./overview";

/** The first-run checklist on the overview. */

export type SetupStep = {
  title: string;
  detail: string;
  done: boolean;
  href?: "/clients/new" | "/projects/new";
};

export function setupSteps(input: {
  businessName: string;
  businessTypeTitle: string;
  clientCount: number;
  projects: readonly Pick<OverviewProject, "status" | "changeCount">[];
}): SetupStep[] {
  const { projects } = input;
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
      title: "Write down a project's scope",
      detail: "List what's included, the price, and how the client pays.",
      done: projects.length > 0,
      href: "/projects/new",
    },
    {
      title: "Get the scope approved",
      detail:
        "Send it to your client. Once they approve, it's locked as the baseline.",
      done: projects.some(
        (p) => p.status === "active" || p.status === "completed",
      ),
    },
    {
      title: "Log extra requests as they come in",
      detail:
        "Each one becomes a priced change request your client approves before you start.",
      done: projects.some((p) => p.changeCount > 0),
    },
  ];
}
