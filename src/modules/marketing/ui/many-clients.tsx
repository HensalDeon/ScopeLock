import { formatINR, rupeesToPaise, sum } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { Container, SectionHeading } from "./primitives";
import { Log, LogRow, LogTotal } from "./thread-log";

/**
 * For studios and agencies: many threads at once, as the Overview keeps
 * them. Example clients, never presented as customers.
 */

type Tone = "settled" | "waiting" | "idle";

const CLIENTS: {
  when: string;
  client: string;
  project: string;
  status: string;
  tone: Tone;
  note: string;
  amount: number;
  waiting: boolean;
  due: boolean;
}[] = [
  {
    when: "9 Nov",
    client: "Kapoor Dental",
    project: "Booking app",
    status: "Waiting for Dr Kapoor",
    tone: "waiting",
    note: "CR-003, sent yesterday · Remind on WhatsApp",
    amount: 18_000,
    waiting: true,
    due: false,
  },
  {
    when: "3 Nov",
    client: "Mehta Interiors",
    project: "Website, 5 pages",
    status: "Paid in full",
    tone: "settled",
    note: "₹80,000 agreed + ₹15,000 CR-001 · UPI",
    amount: 95_000,
    waiting: false,
    due: false,
  },
  {
    when: "1 Nov",
    client: "Nair Textiles",
    project: "Online store",
    status: "Payment due",
    tone: "waiting",
    note: "Design approved, 30%: ₹36,000 + 18% GST · invoice sent",
    amount: 42_480,
    waiting: false,
    due: true,
  },
  {
    when: "29 Oct",
    client: "Sharma & Co",
    project: "Brand refresh",
    status: "Proposal sent",
    tone: "idle",
    note: "Sent 12 days ago · Remind on WhatsApp",
    amount: 1_20_000,
    waiting: true,
    due: false,
  },
];

const total = (pick: (c: (typeof CLIENTS)[number]) => boolean) =>
  formatINR(sum(CLIENTS.filter(pick).map((c) => rupeesToPaise(c.amount))));

export function ManyClients() {
  return (
    <section className="border-b">
      <Container className="py-20 lg:py-28">
        <SectionHeading
          title="Every client, one list."
          intro="A studio or an agency runs ten threads like Rahul's at once. One workspace holds every client: the overview shows each change waiting for a yes and each payment due, and reminds clients on WhatsApp in one tap. Team logins are coming."
        />
        <Log
          className="mt-12"
          label="Example: several clients on one overview"
          heads={["When", "Your clients", "Amount"]}
          footer={
            <LogTotal label="Across all clients">
              <dl className="flex items-end gap-6 tabular-nums sm:justify-end">
                <div>
                  <dt className="text-[12px] whitespace-nowrap text-muted-foreground">
                    Waiting for a yes
                  </dt>
                  <dd className="text-[18px] font-semibold">
                    {total((c) => c.waiting)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-muted-foreground">Due now</dt>
                  <dd className="text-[26px] leading-none font-semibold tracking-[-0.02em]">
                    {total((c) => c.due)}
                  </dd>
                </div>
              </dl>
            </LogTotal>
          }
        >
          {CLIENTS.map((c) => (
            <LogRow
              key={c.client}
              time={c.when}
              billed={formatINR(rupeesToPaise(c.amount))}
              strong={c.tone !== "idle"}
            >
              <div className="grid gap-1 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:items-center sm:gap-6">
                <p className="min-w-0">
                  <span className="block text-[16px] font-semibold">
                    {c.client}
                  </span>
                  <span className="block text-[13px] text-muted-foreground">
                    {c.project}
                  </span>
                </p>
                <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                  <StatusPill tone={c.tone}>{c.status}</StatusPill>
                  <span className="text-[13px] text-muted-foreground">
                    {c.note}
                  </span>
                </p>
              </div>
            </LogRow>
          ))}
        </Log>
      </Container>
    </section>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium whitespace-nowrap",
        tone === "settled" && "bg-success-soft",
        tone === "waiting" && "bg-warning-soft text-warning-ink",
        tone === "idle" && "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "settled" && "bg-brand",
          tone === "waiting" && "bg-warning",
          tone === "idle" && "bg-muted-foreground/60",
        )}
      />
      {children}
    </span>
  );
}
