"use client";

import type { Route } from "next";
import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import type { CurrencyCode } from "@/shared/lib/currency";
import { IDLE } from "@/shared/lib/form-state";
import {
  focusFirstInvalid,
  useFormValidation,
} from "@/shared/lib/use-form-validation";
import { Button } from "@/shared/ui/button";
import { FormAlert } from "@/shared/ui/form-alert";
import { FormSection } from "@/shared/ui/page";
import { MILESTONE_PRESETS, type BillingModel } from "../domain/billing";
import { projectInputSchema } from "../domain/project-input";
import { draftTotal } from "../domain/scope";
import {
  createProject,
  updateProject,
  type ProjectFormState,
} from "../server/actions";
import type { ProposalFormDefaults } from "./proposal-form-defaults";
import {
  ProposalSections,
  proposalRowKey,
  proposalToJson,
  type ProposalFormValue,
} from "./proposal-sections";
import { ClientProjectFields } from "./client-project-fields";
import { PaymentTermsEditor, toMilestoneRows } from "./payment-terms-editor";
import { ScopeLinesEditor, toItemRows } from "./scope-lines-editor";

export type ProjectFormDefaults = {
  clientId: string;
  currency: CurrencyCode;
  name: string;
  description: string;
  items: {
    id?: string;
    title: string;
    description: string;
    includes: string;
    amount: string;
  }[];
  billingModel: BillingModel;
  milestones: { id?: string; name: string; percent: string }[];
  proposal: ProposalFormDefaults;
};

export type ClientOption = {
  id: string;
  label: string;
  /** The client's own currency; null follows the workspace default. */
  currency: CurrencyCode | null;
};

const withRowKeys = (p: ProposalFormDefaults): ProposalFormValue => ({
  ...p,
  highlights: p.highlights.map((h) => ({ ...h, key: proposalRowKey() })),
  timeline: p.timeline.map((s) => ({ ...s, key: proposalRowKey() })),
  addons: p.addons.map((a) => ({ ...a, key: proposalRowKey() })),
});

const DEFAULT_PRESET = MILESTONE_PRESETS[0];

/**
 * Create or edit a draft project: who it's for, the agreed scope (lines with
 * amounts and a live total) and how the client pays (upfront or milestones
 * that must add up to 100%). Rows are kept in state and sent as JSON.
 */
export function ProjectForm({
  mode,
  projectId,
  clients: initialClients,
  defaults,
  defaultCurrency,
  cancelHref,
}: {
  mode: "create" | "edit";
  projectId?: string;
  clients: ClientOption[];
  defaults: ProjectFormDefaults;
  /** Workspace default, for clients without their own currency. */
  defaultCurrency: CurrencyCode;
  cancelHref: Route;
}) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(
    mode === "create" ? createProject : updateProject,
    IDLE,
  );
  const [, startTransition] = useTransition();

  const [clients, setClients] = useState(initialClients);
  const [clientId, setClientId] = useState(defaults.clientId);
  const [currency, setCurrency] = useState<CurrencyCode>(defaults.currency);
  // Follows the chosen client's currency until the person picks one.
  const [currencyChosen, setCurrencyChosen] = useState(mode === "edit");
  const followClient = (id: string, list: ClientOption[] = clients) => {
    if (currencyChosen) return;
    const client = list.find((c) => c.id === id);
    setCurrency(client?.currency ?? defaultCurrency);
  };
  // Controlled: React resets uncontrolled inputs after a form action, which
  // would clear them on a validation error.
  const [name, setName] = useState(defaults.name);
  const [description, setDescription] = useState(defaults.description);
  const [items, setItems] = useState(() => toItemRows(defaults.items));
  const [billingModel, setBillingModel] = useState(defaults.billingModel);
  const [proposal, setProposal] = useState(() =>
    withRowKeys(defaults.proposal),
  );
  const [milestones, setMilestones] = useState(() =>
    toMilestoneRows(
      defaults.billingModel === "milestones" && defaults.milestones.length
        ? defaults.milestones
        : (DEFAULT_PRESET?.milestones ?? []),
    ),
  );

  // What the server receives, built from state; validated live with the
  // server's own schema (see useFormValidation).
  const itemsJson = JSON.stringify(
    items.map(({ id, title, description, includes, amount }) => ({
      id,
      title,
      description,
      includes,
      amount,
    })),
  );
  const proposalJson = proposalToJson(proposal);
  const milestonesJson = JSON.stringify(
    billingModel === "milestones"
      ? milestones.map(({ id, name, percent }) => ({ id, name, percent }))
      : [],
  );
  const values = {
    clientId,
    currency,
    name,
    description,
    items: itemsJson,
    billingModel,
    milestones: milestonesJson,
    proposal: proposalJson,
  };
  const [savedValues] = useState(values);
  const formRef = useRef<HTMLFormElement>(null);
  const form = useFormValidation(projectInputSchema, values, {
    initial: mode === "edit" ? savedValues : undefined,
    serverState: state,
  });
  const err = (path: string, touchKey?: string) =>
    form.errorFor(path, touchKey);

  const total = draftTotal(items.map((item) => item.amount));
  return (
    <form
      // Submitted by hand instead of <form action>: React resets a form after
      // an action, which clears the controlled client <select> on a
      // validation error. This form needs JavaScript anyway (rows are JSON).
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.markSubmitted()) {
          focusFirstInvalid(formRef.current);
          return;
        }
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      noValidate
      className="grid gap-10"
    >
      {mode === "edit" && projectId && (
        <input type="hidden" name="id" value={projectId} />
      )}
      <input type="hidden" name="items" value={itemsJson} />
      <input type="hidden" name="milestones" value={milestonesJson} />
      <input type="hidden" name="proposal" value={proposalJson} />

      {state.status === "error" && state.message && (
        <FormAlert>{state.message}</FormAlert>
      )}

      <ClientProjectFields
        clients={clients}
        setClients={setClients}
        clientId={clientId}
        setClientId={setClientId}
        followClient={followClient}
        currency={currency}
        setCurrency={setCurrency}
        setCurrencyChosen={setCurrencyChosen}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        form={form}
      />

      <ScopeLinesEditor
        items={items}
        setItems={setItems}
        total={total}
        currency={currency}
        form={form}
      />

      <PaymentTermsEditor
        billingModel={billingModel}
        setBillingModel={setBillingModel}
        milestones={milestones}
        setMilestones={setMilestones}
        total={total}
        currency={currency}
        form={form}
      />

      {/* ── Proposal sections ────────────────────────────────────────── */}
      <FormSection
        title="Make it a proposal"
        description="Optional sections your client sees around the scope. Add what helps, leave out the rest."
      >
        <ProposalSections
          currency={currency}
          value={proposal}
          onChange={setProposal}
          errorFor={(path, touchKey) =>
            err(`proposal.${path}`, `proposal.${touchKey ?? path}`)
          }
          touch={form.touch}
          edited={(path) => form.edited(`proposal.${path}`)}
          payments={
            billingModel === "milestones"
              ? milestones.map((m, order) => ({
                  order,
                  name: m.name,
                  percent: m.percent,
                }))
              : []
          }
        />
      </FormSection>

      <div className="flex flex-wrap items-center gap-3 border-t pt-6">
        <Button
          type="submit"
          size="lg"
          disabled={pending || (mode === "edit" && !form.isDirty)}
        >
          {mode === "create"
            ? pending
              ? "Creating project…"
              : "Create project"
            : pending
              ? "Saving…"
              : "Save changes"}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          It stays a draft until you send it to your client.
        </p>
      </div>
    </form>
  );
}
