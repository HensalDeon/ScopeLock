import { Check, Minus } from "lucide-react";
import { FEATURE_LABELS, type Plan, type PlanFeature } from "@/modules/billing";
import { Container, DISPLAY } from "./primitives";

type Value = boolean | string;
type Row = { label: string; values: Value[] };

/**
 * The compare table. Limits and paid features come from the live plans
 * (admin page); what every plan includes is fixed here. A feature that's
 * switched on but not built yet reads "Soon".
 */
function comparison(plans: readonly Plan[]): { group: string; rows: Row[] }[] {
  const all = (label: string, value: Value = true): Row => ({
    label,
    values: plans.map(() => value),
  });
  const feature = (label: string, f: PlanFeature): Row => ({
    label,
    values: plans.map((p) =>
      p.features[f] ? (FEATURE_LABELS[f].built ? true : "Soon") : false,
    ),
  });
  return [
    {
      group: "Projects",
      rows: [
        {
          label: "Active projects",
          values: plans.map((p) => String(p.activeProjects)),
        },
        all("Archived projects", "Unlimited"),
        all("Change requests", "Unlimited"),
      ],
    },
    {
      group: "Your clients",
      rows: [
        all("Approval links (no client login)"),
        feature("Your logo on approval pages", "brandedClientPages"),
        feature("ScopeLock branding hidden", "brandedClientPages"),
      ],
    },
    {
      group: "Payments and records",
      rows: [
        all("Milestone billing"),
        all("UPI, bank and payment-link tracking"),
        all("Change order PDFs"),
        all("Project statement PDFs"),
        all("WhatsApp and email reminders"),
        feature("Automatic payment reminders", "automaticReminders"),
        all("Revenue recovered on your overview"),
        feature(
          "Revenue recovered reports by client and month",
          "recoveredReports",
        ),
      ],
    },
    {
      group: "Team",
      rows: [
        {
          label: "Team members",
          values: plans.map((p) =>
            p.teamMembers === 1 ? "Just you" : `Up to ${p.teamMembers} (soon)`,
          ),
        },
        feature("Priority support", "prioritySupport"),
      ],
    },
  ];
}

function Cell({ value }: { value: Value }) {
  if (value === true)
    return (
      <>
        <Check className="mx-auto size-4 text-brand" aria-hidden />
        <span className="sr-only">Included</span>
      </>
    );
  if (value === false)
    return (
      <>
        <Minus
          className="mx-auto size-4 text-muted-foreground/60"
          aria-hidden
        />
        <span className="sr-only">Not included</span>
      </>
    );
  return <span className="tabular-nums">{value}</span>;
}

export function ComparePlans({ plans }: { plans: readonly Plan[] }) {
  return (
    <section className="border-b bg-canvas">
      <Container className="py-16 sm:py-20">
        <h2 className={`${DISPLAY} text-[30px] leading-none font-semibold`}>
          Compare plans
        </h2>
        <div className="relative mt-8 overflow-x-auto rounded-xl border bg-background">
          <table className="w-full text-[13px] sm:min-w-[40rem] sm:text-[14.5px]">
            <thead>
              <tr className="border-b">
                <th
                  scope="col"
                  className="w-[40%] px-3 py-4 text-left font-normal text-muted-foreground sm:px-5"
                >
                  <span className="sr-only">Feature</span>
                </th>
                {plans.map((p) => (
                  <th
                    key={p.id}
                    scope="col"
                    className="px-1.5 py-4 text-center font-semibold sm:px-4"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            {comparison(plans).map((group) => (
              <tbody key={group.group}>
                <tr className="border-b bg-canvas">
                  <th
                    scope="colgroup"
                    colSpan={plans.length + 1}
                    className="px-3 py-2.5 text-left font-mono text-[11px] font-normal tracking-[0.12em] text-muted-foreground uppercase sm:px-5"
                  >
                    {group.group}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label} className="border-b last:border-b-0">
                    <th
                      scope="row"
                      className="px-3 py-3.5 text-left font-normal sm:px-5"
                    >
                      {row.label}
                    </th>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-1.5 py-3.5 text-center sm:px-4">
                        <Cell value={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </Container>
    </section>
  );
}
