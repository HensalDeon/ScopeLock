"use client";

import { Check, MessageSquareText } from "lucide-react";
import { useActionState, useId, useRef, useState, useTransition } from "react";
import {
  DECISION_LIMITS,
  decisionInputSchema,
  type Decision,
  type DecisionField,
} from "@/modules/approvals";
import { IDLE } from "@/shared/lib/form-state";
import { cn } from "@/shared/lib/utils";
import {
  focusFirstInvalid,
  useFormValidation,
} from "@/shared/lib/use-form-validation";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import type { DecisionState } from "../server/actions";

type Values = Record<DecisionField, string>;

/**
 * The client's answer at the end of the proposal: approve, or ask for
 * changes with a note. Name and email are typed (pre-filled when the
 * freelancer has them) because they go on the signed record.
 */
export function DecisionPanel({
  action: decide,
  kind,
  businessName,
  total,
  defaults,
}: {
  action: (state: DecisionState, data: FormData) => Promise<DecisionState>;
  /** The proposal, or a change request after it. */
  kind: "proposal" | "change";
  businessName: string;
  /** Formatted, e.g. "₹80,000". */
  total: string;
  defaults: { name: string; email: string };
}) {
  const copy =
    kind === "proposal"
      ? proposalCopy(businessName, total)
      : changeCopy(businessName, total);
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<DecisionState, FormData>(
    decide,
    IDLE,
  );
  const [, startTransition] = useTransition();
  const [values, setValues] = useState<Values>({
    decision: "",
    name: defaults.name,
    email: defaults.email,
    comment: "",
  });
  const form = useFormValidation(decisionInputSchema, values, {
    serverState: state,
  });
  const choice = values.decision as Decision | "";

  const field = (name: Exclude<DecisionField, "decision">) => ({
    id: `${uid}-${name}`,
    name,
    value: values[name],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      form.edited(name);
    },
    onBlur: () => form.touch(name),
    "aria-invalid": Boolean(form.errorFor(name)) || undefined,
  });

  const choose = (decision: Decision) => {
    setValues((v) => ({ ...v, decision }));
    form.edited("decision");
  };

  if (state.status === "success") {
    return (
      <p role="status" className="text-[15px] font-medium">
        {state.message}
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.markSubmitted()) {
          focusFirstInvalid(formRef.current);
          return;
        }
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="decision" value={values.decision} />
      <FieldGroup className="gap-6">
        {state.status === "error" && state.message && (
          <FormAlert>{state.message}</FormAlert>
        )}

        <div
          role="group"
          aria-label="Your answer"
          className="grid gap-2 sm:grid-cols-2"
        >
          <ChoiceButton
            selected={choice === "approved"}
            onSelect={() => choose("approved")}
            icon={<Check aria-hidden />}
            title="Approve"
            detail={copy.approveDetail}
          />
          <ChoiceButton
            selected={choice === "rejected"}
            onSelect={() => choose("rejected")}
            icon={<MessageSquareText aria-hidden />}
            title={copy.rejectTitle}
            detail={copy.rejectDetail}
          />
        </div>
        {form.errorFor("decision") && (
          <p className="-mt-3 text-sm text-destructive">
            {form.errorFor("decision")}
          </p>
        )}

        {choice && (
          <>
            {choice === "rejected" && (
              <Field
                data-invalid={Boolean(form.errorFor("comment")) || undefined}
              >
                <FieldLabel htmlFor={`${uid}-comment`}>
                  {copy.rejectLabel}
                </FieldLabel>
                <Textarea
                  {...field("comment")}
                  rows={4}
                  maxLength={DECISION_LIMITS.comment}
                  placeholder={copy.rejectPlaceholder}
                />
                <FieldError>{form.errorFor("comment")}</FieldError>
              </Field>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(form.errorFor("name")) || undefined}>
                <FieldLabel htmlFor={`${uid}-name`}>Your full name</FieldLabel>
                <Input
                  {...field("name")}
                  autoComplete="name"
                  maxLength={DECISION_LIMITS.name}
                />
                <FieldError>{form.errorFor("name")}</FieldError>
              </Field>
              <Field
                data-invalid={Boolean(form.errorFor("email")) || undefined}
              >
                <FieldLabel htmlFor={`${uid}-email`}>Your email</FieldLabel>
                <Input
                  {...field("email")}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={DECISION_LIMITS.email}
                />
                <FieldError>{form.errorFor("email")}</FieldError>
              </Field>
            </div>
            {choice === "approved" && (
              <Field>
                <FieldLabel htmlFor={`${uid}-comment`}>
                  Note for {businessName} (optional)
                </FieldLabel>
                <Textarea
                  {...field("comment")}
                  rows={2}
                  maxLength={DECISION_LIMITS.comment}
                />
                <FieldError>{form.errorFor("comment")}</FieldError>
              </Field>
            )}
            <div className="grid gap-3">
              <FieldDescription>
                {choice === "approved" ? copy.approveNote : copy.rejectNote}
              </FieldDescription>
              <Button
                type="submit"
                size="lg"
                disabled={pending}
                className="w-full sm:w-auto sm:justify-self-start"
              >
                {choice === "approved"
                  ? pending
                    ? "Approving…"
                    : `Approve for ${total}`
                  : pending
                    ? "Sending…"
                    : copy.rejectSubmit}
              </Button>
            </div>
          </>
        )}
      </FieldGroup>
    </form>
  );
}

function ChoiceButton({
  selected,
  onSelect,
  icon,
  title,
  detail,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-background px-4 py-3.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
        selected
          ? "border-primary ring-1 ring-primary"
          : "hover:border-foreground/30",
      )}
    >
      {icon}
      <span className="grid gap-0.5">
        <span className="text-[15px] font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{detail}</span>
      </span>
    </button>
  );
}

function proposalCopy(business: string, total: string) {
  return {
    approveDetail: `The scope and ${total} as written`,
    rejectTitle: "Ask for changes",
    rejectDetail: `Tell ${business} what to change`,
    rejectLabel: "What would you like changed?",
    rejectPlaceholder:
      "For example: add a blog section, and move launch to 15 Dec.",
    rejectSubmit: "Send my changes",
    approveNote: `Your name, email, the time and your IP address are saved with a copy of this proposal, so you and ${business} have the same record of what was agreed.`,
    rejectNote: `${business} gets your note by email and will send an updated proposal to this same link.`,
  };
}

function changeCopy(business: string, total: string) {
  return {
    approveDetail: `Add this to the project for ${total}`,
    rejectTitle: "Decline",
    rejectDetail: "Nothing is added to the project",
    rejectLabel: `Why are you declining? ${business} may be able to adjust it.`,
    rejectPlaceholder: "For example: the price is more than we planned.",
    rejectSubmit: "Decline this change",
    approveNote: `Your name, email, the time and your IP address are saved with a copy of this change request, so you and ${business} have the same record of what was agreed.`,
    rejectNote: `${business} gets your note by email. Nothing is added to the project.`,
  };
}
