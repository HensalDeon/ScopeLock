import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, minor } from "@/shared/lib/money";

/**
 * One line in a project's history. Insert-only. The freelancer sees every
 * event; the client sees only the ones about things shared with them, and
 * never internal notes, IP addresses or link changes.
 */
export const ACTIVITY_TYPES = [
  "project.created",
  "proposal.sent",
  "proposal.withdrawn",
  "proposal.approved",
  "proposal.changes_requested",
  "link.replaced",
  "change.created",
  "change.sent",
  "change.withdrawn",
  "change.cancelled",
  "change.approved",
  "change.rejected",
  "payment.requested",
  "payment.cancelled",
  "payment.reported",
  "payment.confirmed",
  "payment.not_received",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type ActivityActor =
  | { kind: "member"; userId: string; name: string }
  | { kind: "client"; name: string; email: string };

export type ActivityData = {
  /** Change request label, e.g. "CR-001". */
  label?: string;
  title?: string;
  amount?: number;
  currency?: CurrencyCode;
  comment?: string | null;
};

export type ActivityEvent = {
  id: string;
  projectId: string;
  type: ActivityType;
  at: Date;
  actor: ActivityActor;
  data: ActivityData;
};

const CLIENT_VISIBLE: ReadonlySet<ActivityType> = new Set([
  "proposal.sent",
  "proposal.withdrawn",
  "proposal.approved",
  "proposal.changes_requested",
  "change.sent",
  "change.withdrawn",
  "change.cancelled",
  "change.approved",
  "change.rejected",
  "payment.requested",
  "payment.cancelled",
  "payment.reported",
  "payment.confirmed",
  "payment.not_received",
]);

export function isClientVisible(type: ActivityType): boolean {
  return CLIENT_VISIBLE.has(type);
}

export type Viewer =
  { kind: "member"; userId: string } | { kind: "client"; businessName: string };

export type ActivityLine = {
  text: string;
  /** A quoted note from the client, shown under the line. */
  quote: string | null;
  tone: "done" | "waiting" | "neutral";
};

/** One event in plain words, from the viewer's side. */
export function describeActivity(
  event: ActivityEvent,
  viewer: Viewer,
): ActivityLine {
  const { data, actor } = event;
  // Who did it: "You" for the member reading it, the business for the client.
  const who =
    actor.kind === "client"
      ? actor.name
      : viewer.kind === "client"
        ? viewer.businessName
        : actor.userId === viewer.userId
          ? "You"
          : actor.name;
  const amount =
    data.amount !== undefined && data.currency
      ? ` (${formatMoney(minor(data.amount), data.currency)})`
      : "";
  const change = [data.label, data.title].filter(Boolean).join(" ");
  const toYou = viewer.kind === "client" ? " to you" : "";
  const line = (
    text: string,
    tone: ActivityLine["tone"] = "neutral",
    quote: string | null = null,
  ): ActivityLine => ({ text, tone, quote });

  switch (event.type) {
    case "project.created":
      return line(`${who} created the project`);
    case "proposal.sent":
      return line(`${who} sent the proposal${toYou}${amount}`, "waiting");
    case "proposal.withdrawn":
      return line(`${who} took the proposal back to update it`);
    case "proposal.approved":
      return line(
        `${who} approved the proposal${amount}`,
        "done",
        data.comment ?? null,
      );
    case "proposal.changes_requested":
      return line(
        `${who} asked for changes to the proposal`,
        "waiting",
        data.comment ?? null,
      );
    case "link.replaced":
      return line(`${who} replaced the client link`);
    case "change.created":
      return line(`${who} drafted ${change}${amount}`);
    case "change.sent":
      return line(`${who} sent ${change}${toYou}${amount}`, "waiting");
    case "change.withdrawn":
      return line(`${who} took ${change} back to update it`);
    case "change.cancelled":
      return line(`${who} cancelled ${change}`);
    case "change.approved":
      return line(
        `${who} approved ${change}${amount}`,
        "done",
        data.comment ?? null,
      );
    case "change.rejected":
      return line(`${who} declined ${change}`, "neutral", data.comment ?? null);
    case "payment.requested":
      return line(
        `${who} asked for the ${data.title} payment${amount}`,
        "waiting",
      );
    case "payment.cancelled":
      return line(`${who} cancelled the ${data.title} payment request`);
    case "payment.reported":
      return line(
        `${who} said the ${data.title} payment was made${amount}`,
        "waiting",
        data.comment ?? null,
      );
    case "payment.confirmed":
      return line(
        `${who} confirmed the ${data.title} payment was received${amount}`,
        "done",
      );
    case "payment.not_received":
      return line(
        `${who} marked the ${data.title} payment as not received yet`,
        "waiting",
        data.comment ?? null,
      );
  }
}
