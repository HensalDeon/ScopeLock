import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/modules/marketing";
import { legal, site } from "@/shared/config/site";
import { isBillingConfigured } from "@/shared/lib/env";

export const metadata: Metadata = {
  title: "Refund and cancellation policy",
  description: `How cancelling a ${site.name} plan works, and when you get a refund.`,
  alternates: { canonical: "/refunds" },
};

const sections: LegalSection[] = [
  {
    id: "free-plan",
    title: "Free plan",
    body: (
      <p>
        The Free plan costs nothing and needs no card, so there is nothing to
        cancel or refund. You can close your account at any time.
      </p>
    ),
  },
  {
    id: "cancelling",
    title: "Cancelling a paid plan",
    body: (
      <ul>
        <li>Cancel any time from Settings, or by emailing {legal.email}.</li>
        <li>You won&apos;t be charged again after you cancel.</li>
        <li>
          Your paid features stay active until the end of the month you have
          already paid for, then your workspace moves to the Free plan.
        </li>
        <li>
          Nothing is deleted. If you have more active projects than the Free
          plan allows, archive some to start new ones. Archived projects stay
          readable and downloadable.
        </li>
      </ul>
    ),
  },
  {
    id: "refunds",
    title: "When we refund",
    body: (
      <>
        <p>
          Plans are billed monthly in advance, and we don&apos;t refund unused
          days in a month you cancel. We will refund you in full for a charge
          when:
        </p>
        <ul>
          <li>you were charged after you had already cancelled;</li>
          <li>you were charged twice for the same period;</li>
          <li>
            {site.name} was unavailable for more than 72 hours in a row during
            that billing period because of a problem on our side.
          </li>
        </ul>
        <p>
          If you upgraded by mistake and haven&apos;t used any paid features,
          write to us within 48 hours and we&apos;ll refund that charge.
        </p>
      </>
    ),
  },
  {
    id: "how-to-ask",
    title: "How to ask for a refund",
    body: (
      <p>
        Email {legal.email} within 7 days of the charge, from the email address
        on your account, with the Razorpay payment ID from your invoice. We
        reply within 2 business days.
      </p>
    ),
  },
  {
    id: "timelines",
    title: "How refunds are paid",
    body: (
      <p>
        Approved refunds go back to the original payment method through
        Razorpay. They are processed within 5 to 7 business days of approval;
        your bank may take a few more days to show the credit.
      </p>
    ),
  },
  {
    id: "plan-changes",
    title: "Upgrades and downgrades",
    body: (
      <ul>
        <li>
          Upgrades take effect straight away. You pay the difference for the
          rest of the current month.
        </li>
        <li>
          Downgrades take effect from your next billing date. No partial refund
          is given for the current month.
        </li>
      </ul>
    ),
  },
  {
    id: "client-payments",
    title: "Payments between you and your clients",
    body: (
      <p>
        {site.name} never handles money between you and your clients. Refunds or
        disputes about those payments are between you and your client. See our{" "}
        <Link href="/terms">Terms of service</Link>.
      </p>
    ),
  },
];

export default function RefundsPage() {
  return (
    <LegalDocument
      title="Refund and cancellation policy"
      intro={
        <p>
          Cancel whenever you like. Here&apos;s what happens to your plan when
          you do, and when you get money back.
          {isBillingConfigured()
            ? ""
            : " Paid plans aren't open yet; this applies from the day they open."}
        </p>
      }
      sections={sections}
    />
  );
}
