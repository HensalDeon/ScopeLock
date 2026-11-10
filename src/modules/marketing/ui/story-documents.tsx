import {
  ChangeOrderDocument,
  ClassicDocument,
  DEFAULT_DOCUMENT_STYLE,
  sampleProposal,
  STARTER_PROPOSAL_DEFAULTS,
  type ChangeOrderData,
  type DocumentAcceptance,
  type ProposalDocumentData,
} from "@/modules/documents";
import { formatINR, minor } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { rupees, STORY } from "../domain/story";
import { DocDetails } from "./doc-details";

/**
 * The story's proposal and change order, drawn by the same components the
 * client sees in the app: real product, not a mock-up. Dates are fixed so
 * the page can be prerendered.
 */

const BUSINESS: ProposalDocumentData["business"] = {
  name: STORY.studio,
  tagline: "Web design and development",
  email: "hello@menon-studio.example",
  phone: null,
};

const PROPOSAL: ProposalDocumentData = {
  ...sampleProposal(
    BUSINESS,
    "we",
    STARTER_PROPOSAL_DEFAULTS,
    new Date("2026-10-06T11:00:00+05:30"),
  ),
  reference: "P-007",
  // The sections that carry the deal: what's included, the price, the
  // 30/30/40 schedule. The rest of the sample proposal stays in Settings.
  overview: null,
  callout: null,
  highlights: [],
  timeline: [],
  addons: [],
  clientProvides: [],
  exclusions: [],
  terms: [],
};

const APPROVED: DocumentAcceptance = {
  verdict: "Approved",
  name: STORY.client,
  email: STORY.clientEmail,
  at: new Date("2026-10-07T18:05:00+05:30"),
  comment: null,
};

const CHANGE_ORDER: ChangeOrderData = {
  voice: "we",
  business: BUSINESS,
  client: PROPOSAL.client,
  reference: STORY.change.label,
  projectReference: PROPOSAL.reference,
  projectTitle: PROPOSAL.title,
  currency: "INR",
  title: STORY.change.title,
  description: `You asked for these on WhatsApp on ${STORY.change.askedOn}. They weren't part of the 5-page website we agreed, so here is what they cost.`,
  items: [
    {
      id: "blog",
      title: "Blog",
      description: "Categories, search and 3 starter posts.",
      amount: minor(1_100_000),
    },
    {
      id: "chat",
      title: "WhatsApp chat button",
      description: "On every page, opening a chat with your number.",
      amount: minor(400_000),
    },
  ],
  total: minor(STORY.change.amount * 100),
  gstPercent: null,
  billing: `Added to the “${STORY.change.billedWith}” payment.`,
  originalTotal: minor(STORY.agreed * 100),
  issuedOn: new Date("2026-10-28T15:19:00+05:30"),
};

/** The warm desk a client document sits on. */
function Desk({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-[#ebe8e2] p-3 sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A real document, as a picture: described once, never read twice. */
function Sheet({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="img" aria-label={label} data-nosnippet>
      <div aria-hidden inert>
        {children}
      </div>
    </div>
  );
}

const SHEET =
  "max-w-[210mm] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] sm:rounded-[2px]";
/** Phones: the A4 layout scaled to half, inside "See the whole …". */
const SHEET_SMALL = `${SHEET} w-[640px] [zoom:0.5]`;

/**
 * Phones read the money at full size; the whole sheet opens below it.
 * Wider screens show the sheet itself.
 */
function PhoneSlip({
  rows,
  total,
  note,
  open,
  hide,
  children,
}: {
  rows: [string, string][];
  total: [string, string];
  note: string;
  /** "See the whole proposal". */
  open: string;
  /** "Hide the proposal". */
  hide: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 sm:hidden">
      <div className="rounded-xl bg-[#ebe8e2] p-3">
        <dl className="rounded-[2px] bg-white px-4 py-3 text-[15px] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)]">
          {rows.map(([k, v]) => (
            <div
              key={k}
              className="flex items-baseline justify-between gap-4 border-b py-2"
            >
              <dt className="min-w-0">{k}</dt>
              <dd className="tabular-nums">{v}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-4 pt-3">
            <dt className="font-semibold">{total[0]}</dt>
            <dd className="text-[22px] font-semibold tabular-nums">
              {total[1]}
            </dd>
          </div>
          <p className="pt-1 text-[13px] text-muted-foreground">{note}</p>
        </dl>
      </div>
      <DocDetails show={open} hide={hide}>
        <Desk className="flex justify-center">{children}</Desk>
      </DocDetails>
    </div>
  );
}

export function ProposalOnDesk() {
  const label = `The proposal ${STORY.client} approved: ${STORY.pages.length} pages for ₹80,000, paid 30/30/40`;
  const doc = (className: string) => (
    <Sheet label={label}>
      <ClassicDocument
        data={PROPOSAL}
        acceptance={APPROVED}
        style={DEFAULT_DOCUMENT_STYLE}
        titleAs="h2"
        className={className}
      />
    </Sheet>
  );
  return (
    <>
      <PhoneSlip
        rows={STORY.milestones.map((m) => [
          `${m.name} ${m.percent}%`,
          rupees(m.amount),
        ])}
        total={["Agreed", rupees(STORY.agreed)]}
        note={`${STORY.pages.join(", ")}. Approved by ${STORY.client}, ${STORY.agreedOn}.`}
        open="See the whole proposal"
        hide="Hide the proposal"
      >
        {doc(SHEET_SMALL)}
      </PhoneSlip>
      <Desk className="max-sm:hidden">
        <div className="mx-auto w-[210mm] [zoom:0.5] md:[zoom:0.6] lg:[zoom:0.72]">
          {doc(SHEET)}
        </div>
      </Desk>
    </>
  );
}

export function ChangeOrderOnDesk({ className }: { className?: string }) {
  const c = STORY.change;
  const label = `Change order ${c.label}: ${c.title}, ₹15,000, added to the ${c.billedWith} payment`;
  const doc = (sheetClass: string) => (
    <Sheet label={label}>
      <ChangeOrderDocument
        data={CHANGE_ORDER}
        style={DEFAULT_DOCUMENT_STYLE}
        titleAs="h2"
        className={sheetClass}
      />
    </Sheet>
  );
  return (
    <div className={className}>
      <PhoneSlip
        rows={CHANGE_ORDER.items.map((i) => [i.title, formatINR(i.amount)])}
        total={["This change", rupees(c.amount)]}
        note={CHANGE_ORDER.billing}
        open="See the whole change order"
        hide="Hide the change order"
      >
        {doc(SHEET_SMALL)}
      </PhoneSlip>
      <Desk className="max-sm:hidden">{doc(SHEET)}</Desk>
    </div>
  );
}
