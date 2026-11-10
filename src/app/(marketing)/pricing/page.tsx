import { Check, Minus } from "lucide-react";
import type { Metadata } from "next";
import { PLANS } from "@/modules/billing";
import {
  Container,
  Faq,
  FinalCta,
  RateCard,
  SectionHeading,
  type FaqItem,
} from "@/modules/marketing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "ScopeLock is free for 2 projects. Pro is ₹499 a month for freelancers and small studios, Agency is ₹1,999 a month for studios and agencies with more clients.",
  alternates: { canonical: "/pricing" },
};

type Row = {
  label: string;
  values: [boolean | string, boolean | string, boolean | string];
};

const COMPARISON: { group: string; rows: Row[] }[] = [
  {
    group: "Projects",
    rows: [
      {
        label: "Active projects",
        values: PLANS.map((p) => String(p.activeProjects)) as Row["values"],
      },
      {
        label: "Archived projects",
        values: ["Unlimited", "Unlimited", "Unlimited"],
      },
      {
        label: "Change requests",
        values: ["Unlimited", "Unlimited", "Unlimited"],
      },
    ],
  },
  {
    group: "Your clients",
    rows: [
      { label: "Approval links (no client login)", values: [true, true, true] },
      { label: "Your logo on approval pages", values: [false, true, true] },
      { label: "ScopeLock branding hidden", values: [false, true, true] },
    ],
  },
  {
    group: "Payments and records",
    rows: [
      { label: "Milestone billing", values: [true, true, true] },
      {
        label: "UPI, bank and payment-link tracking",
        values: [true, true, true],
      },
      { label: "Change order PDFs", values: [true, true, true] },
      { label: "Project statement PDFs", values: [false, true, true] },
      { label: "Payment reminders", values: [false, true, true] },
      { label: "Revenue recovered reports", values: [false, false, true] },
    ],
  },
  {
    group: "Team",
    rows: [
      {
        label: "Team members",
        values: PLANS.map((p) =>
          p.teamMembers === 1 ? "Just you" : `Up to ${p.teamMembers} (soon)`,
        ) as Row["values"],
      },
      { label: "Priority support", values: [false, false, true] },
    ],
  },
];

const BILLING_FAQ: FaqItem[] = [
  {
    q: "What counts as an active project?",
    a: "Any project that isn't archived. Archive a project when it's finished and paid; it stays readable and downloadable, and stops counting towards your limit.",
  },
  {
    q: "How do I pay for ScopeLock?",
    a: "There's nothing to pay yet: paid plans aren't open. When they open, you'll pay monthly by UPI, card or net banking, with a GST invoice for every payment.",
  },
  {
    q: "What happens if I go over my plan's limit?",
    a: "Nothing breaks. You can't start a new project until you archive one or upgrade. Existing projects keep working for you and your clients.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes, once paid plans open. Upgrades will apply straight away, downgrades from your next billing date.",
  },
];

function Cell({ value }: { value: boolean | string }) {
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

export default function PricingPage() {
  return (
    <>
      <section className="border-b">
        <Container className="py-16 sm:py-20">
          <SectionHeading
            as="h1"
            title="Pays for itself with one approved change."
            intro="Start free on your next project. Pro and Agency are planned prices; paid plans aren't open yet, so everyone starts on Free. Prices in Indian rupees; GST extra where applicable."
          />
          <RateCard className="mt-12" />
        </Container>
      </section>

      <section className="border-b bg-canvas">
        <Container className="py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
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
                  {PLANS.map((p) => (
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
              {COMPARISON.map((group) => (
                <tbody key={group.group}>
                  <tr className="border-b bg-canvas">
                    <th
                      scope="colgroup"
                      colSpan={4}
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
                        <td
                          key={i}
                          className="px-1.5 py-3.5 text-center sm:px-4"
                        >
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

      <section className="border-b">
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <SectionHeading
            title="Plans and payments."
            className="content-start self-start"
          />
          <Faq items={BILLING_FAQ} />
        </Container>
      </section>

      <FinalCta />
    </>
  );
}
