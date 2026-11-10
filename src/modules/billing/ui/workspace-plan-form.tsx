"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { formatINR } from "@/shared/lib/money";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/shared/ui/field";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Textarea } from "@/shared/ui/textarea";
import { TOUCH } from "@/shared/ui/touch";
import type { Plan, PlanId } from "../domain/plans";
import { setWorkspacePlan } from "../server/workspace-plan-actions";

/**
 * Admin: put one workspace on a plan by hand, with the reason (kept in the
 * change log). It applies at once and the workspace isn't charged.
 */
export function WorkspacePlanForm({
  workspaceId,
  workspaceName,
  current,
  savedNote,
  activeProjects,
  plans,
}: {
  workspaceId: string;
  workspaceName: string;
  current: PlanId;
  /** The reason saved with the current plan, if an admin set it. */
  savedNote: string | null;
  /** Its projects that aren't archived, to warn before a smaller plan. */
  activeProjects: number;
  plans: readonly Plan[];
}) {
  const uid = useId();
  const [state, action, pending] = useActionState(setWorkspacePlan, IDLE);
  const [, startTransition] = useTransition();
  const [planId, setPlanId] = useState<string>(current);
  const [note, setNote] = useState("");
  // After a save, start the reason box empty again (as on first load).
  const [seen, setSeen] = useState(state);
  if (seen !== state) {
    setSeen(state);
    if (state.status === "success") setNote("");
  }
  const chosen = plans.find((p) => p.id === planId);
  const changing = planId !== current;
  const reason = note.trim();
  // Every save needs a reason; on the same plan, a different one.
  const canSave = reason !== "" && (changing || reason !== (savedNote ?? ""));
  const tooSmall = changing && chosen && chosen.activeProjects < activeProjects;
  const noteError = state.status === "error" ? state.fieldErrors?.note : null;

  return (
    <form
      className="grid gap-6"
      // Submitted by hand so a failed save keeps the choice (a form action
      // would reset the plan picker).
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <FieldSet>
        <FieldLegend variant="label">Plan</FieldLegend>
        <RadioGroup
          name="planId"
          value={planId}
          onValueChange={setPlanId}
          className="grid gap-2 sm:grid-cols-3"
        >
          {plans.map((p) => (
            <FieldLabel
              key={p.id}
              htmlFor={`${uid}-${p.id}`}
              className="has-data-checked:border-primary has-data-checked:ring-1 has-data-checked:ring-primary"
            >
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>
                    {p.name}
                    {p.id === current && (
                      <span className="font-normal text-muted-foreground">
                        (now)
                      </span>
                    )}
                  </FieldTitle>
                  <FieldDescription className="tabular-nums">
                    {formatINR(p.monthlyPrice)} a month · {p.activeProjects}{" "}
                    projects
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem
                  value={p.id}
                  id={`${uid}-${p.id}`}
                  aria-label={`${p.name}${p.id === current ? ", the current plan" : ""}`}
                />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </FieldSet>

      <Field data-invalid={Boolean(noteError) || undefined}>
        <FieldLabel htmlFor={`${uid}-note`}>Reason (required)</FieldLabel>
        <Textarea
          id={`${uid}-note`}
          name="note"
          rows={2}
          maxLength={140}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-invalid={Boolean(noteError) || undefined}
          placeholder="Like “Beta user from the October WhatsApp group”"
        />
        <FieldDescription>
          Kept in this workspace&apos;s history below, with your email. The
          workspace doesn&apos;t see it. The plan stays until someone changes it
          here.
        </FieldDescription>
        <FieldError>{noteError}</FieldError>
      </Field>

      <div className="grid gap-3">
        {changing && chosen && (
          <p className="text-sm text-pretty">
            {workspaceName} moves to {chosen.name} straight away
            {chosen.monthlyPrice > 0 ? ", without being charged." : "."}
          </p>
        )}
        {tooSmall && chosen && (
          <p className="text-sm text-pretty text-warning-ink">
            They have {activeProjects} active projects; {chosen.name} allows{" "}
            {chosen.activeProjects}. Nothing is removed.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            className={TOUCH}
            disabled={pending || !canSave}
          >
            {pending
              ? "Saving…"
              : changing && chosen
                ? `Move to ${chosen.name}`
                : "Update the reason"}
          </Button>
          {state.status === "error" && state.message && !noteError ? (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          ) : (
            <p role="status" className="text-sm text-muted-foreground">
              {state.status === "success" && !canSave
                ? state.message
                : !canSave && !pending
                  ? changing
                    ? "Write the reason to save."
                    : "Choose another plan, or write a new reason."
                  : ""}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
