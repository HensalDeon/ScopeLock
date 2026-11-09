import { sum, type Minor } from "@/shared/lib/money";
import type { ScheduleItem } from "./payment";

/**
 * The one thing to do next on a project's payments, in order of urgency:
 * check money the client says they've sent, wait on a request that's out,
 * ask for the next payment, or nothing (everything is paid).
 */
export type NextStep =
  | { kind: "confirm"; item: ScheduleItem }
  | { kind: "waiting"; item: ScheduleItem }
  | { kind: "ask"; item: ScheduleItem }
  | { kind: "settled" };

export function nextStep(items: readonly ScheduleItem[]): NextStep | null {
  if (items.length === 0) return null;
  const reported = items.find((i) => i.state === "client_reported");
  if (reported) return { kind: "confirm", item: reported };
  const due = items.find((i) => i.state === "due");
  if (due) return { kind: "waiting", item: due };
  const upcoming = items.find((i) => i.state === "upcoming");
  if (upcoming) return { kind: "ask", item: upcoming };
  return { kind: "settled" };
}

/** Not asked for yet: what's left once received and due are taken out. */
export function stillToAsk(items: readonly ScheduleItem[]): Minor {
  return sum(items.filter((i) => i.state === "upcoming").map((i) => i.payable));
}

/** A request older than this gets "Remind" instead of a first "Send". */
export const REMIND_AFTER_DAYS = 3;

export function isReminder(requestedAt: Date, now: Date): boolean {
  return (
    now.getTime() - requestedAt.getTime() >
    REMIND_AFTER_DAYS * 24 * 60 * 60 * 1000
  );
}
