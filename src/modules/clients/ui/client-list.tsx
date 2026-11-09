import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, type Minor } from "@/shared/lib/money";
import { formatPhone } from "@/shared/lib/phone";
import type { Client } from "../domain/client";

/** Rows of clients linking to their pages. Server component. */
export function ClientList({
  clients,
  projectCounts,
  due,
}: {
  clients: Client[];
  /** Projects per client id, when the page has them. */
  projectCounts?: ReadonlyMap<string, number>;
  /** What each client owes now (asked for, not received), per currency. */
  due?: ReadonlyMap<string, { currency: CurrencyCode; amount: Minor }[]>;
}) {
  return (
    <ul className="divide-y rounded-xl border bg-background">
      {clients.map((client) => (
        <li key={client.id}>
          <Link
            href={`/clients/${client.id}`}
            className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-canvas sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{client.name}</p>
              {(client.company || projectCounts) && (
                <p className="truncate text-sm text-muted-foreground">
                  {[
                    client.company,
                    projectCounts &&
                      projectLabel(projectCounts.get(client.id) ?? 0),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
            {due?.get(client.id)?.length ? (
              <span className="shrink-0 rounded-md bg-warning-soft px-2 py-0.5 text-sm font-medium text-warning-ink tabular-nums">
                {due
                  .get(client.id)
                  ?.map((d) => formatMoney(d.amount, d.currency))
                  .join(" + ")}{" "}
                due
              </span>
            ) : null}
            <div className="hidden min-w-0 text-right text-sm text-muted-foreground sm:block">
              {client.phone && (
                <p className="tabular-nums">{formatPhone(client.phone)}</p>
              )}
              {client.email && <p className="truncate">{client.email}</p>}
            </div>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function projectLabel(count: number): string {
  if (count === 0) return "No projects yet";
  return `${count} project${count === 1 ? "" : "s"}`;
}
