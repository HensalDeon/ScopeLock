import {
  ChangeOrderDocument,
  ClassicDocument,
  DEFAULT_DOCUMENT_STYLE,
  sampleProposal,
  STARTER_PROPOSAL_DEFAULTS,
  type ChangeOrderData,
  type ProposalDocumentData,
} from "@/modules/documents";
import { minor } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { STORY } from "../domain/story";

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

/** A sheet on the warm desk, cut off at the desk's edge like a long page. */
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
        "relative overflow-hidden rounded-xl bg-[#ebe8e2] px-3 pt-3 sm:px-8 sm:pt-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

const SHEET =
  "max-w-[210mm] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] sm:rounded-[2px]";

export function ProposalOnDesk() {
  return (
    <Desk className="h-[34rem] sm:h-[42rem]">
      <div
        role="img"
        aria-label={`The proposal ${STORY.client} approved: ${PROPOSAL.title}, ${STORY.pages.length} pages, ₹80,000 paid 30/30/40`}
      >
        <div aria-hidden inert>
          <ClassicDocument
            data={PROPOSAL}
            style={DEFAULT_DOCUMENT_STYLE}
            titleAs="h2"
            className={SHEET}
          />
        </div>
      </div>
    </Desk>
  );
}

export function ChangeOrderOnDesk({ className }: { className?: string }) {
  return (
    <Desk className={cn("h-[52rem] sm:h-[47rem]", className)}>
      <div
        role="img"
        aria-label={`Change order ${STORY.change.label}: ${STORY.change.title}, ₹15,000, added to the ${STORY.change.billedWith} payment`}
      >
        <div aria-hidden inert>
          <ChangeOrderDocument
            data={CHANGE_ORDER}
            style={DEFAULT_DOCUMENT_STYLE}
            titleAs="h2"
            className={SHEET}
          />
        </div>
      </div>
    </Desk>
  );
}
