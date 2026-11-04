import type { Metadata } from "next";
import Link from "next/link";
import {
  BusinessDetails,
  LegalDocument,
  type LegalSection,
} from "@/modules/marketing";
import { legal, site } from "@/shared/config/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: `The terms that apply when you use ${site.name}.`,
  alternates: { canonical: "/terms" },
};

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          {site.name} is operated by {legal.businessName}, a{" "}
          {legal.businessType} registered in India (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;). In these terms, &ldquo;you&rdquo; means the person
          or business that creates a {site.name} account.
        </p>
        <BusinessDetails />
      </>
    ),
  },
  {
    id: "accepting",
    title: "Accepting these terms",
    body: (
      <p>
        By creating an account or using {site.name}, you agree to these terms
        and to our <Link href="/privacy">Privacy policy</Link> and{" "}
        <Link href="/refunds">Refund and cancellation policy</Link>. If you use{" "}
        {site.name} on behalf of a business, you confirm you are allowed to
        accept these terms for it. You must be at least 18 years old.
      </p>
    ),
  },
  {
    id: "your-account",
    title: "Your account",
    body: (
      <ul>
        <li>
          Give accurate details when you sign up and keep them up to date.
        </li>
        <li>
          Keep your password safe. You are responsible for everything done from
          your account and workspace.
        </li>
        <li>
          Tell us straight away at {legal.email} if you think someone else has
          access to your account.
        </li>
      </ul>
    ),
  },
  {
    id: "what-scopelock-does",
    title: "What ScopeLock does, and doesn't do",
    body: (
      <>
        <p>
          {site.name} helps you record the scope you agree with your clients,
          send change requests for approval, and keep track of payments. It
          keeps a timestamped record of what was shown to your client and how
          they responded.
        </p>
        <ul>
          <li>
            We are not a party to any agreement between you and your clients.
            Disputes between you and a client are yours to resolve.
          </li>
          <li>
            We do not collect, hold or transfer money between you and your
            clients. Client payments go directly to you through the methods you
            choose. We only record what you or your client tell us was paid.
          </li>
          <li>
            Approval records show what a person saw and clicked, and when. They
            can support your position in a disagreement, but we do not promise
            that any record will be accepted as evidence or enforced by a court.
          </li>
          <li>{site.name} is not legal, tax or financial advice.</li>
        </ul>
      </>
    ),
  },
  {
    id: "your-content",
    title: "Your content and your clients' data",
    body: (
      <>
        <p>
          You own everything you put into {site.name}: projects, prices,
          documents and client details (&ldquo;your content&rdquo;). You give us
          permission to store, process and display your content only as needed
          to run the service for you.
        </p>
        <p>
          When you add a client&apos;s details or send them a link, we process
          their personal data on your behalf. You confirm you have the right to
          share that data with us and that you will tell your clients how it is
          used, as described in our <Link href="/privacy">Privacy policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>
            use {site.name} for anything unlawful, fraudulent or misleading;
          </li>
          <li>
            send approval or payment requests for work that wasn&apos;t
            requested, or impersonate another business;
          </li>
          <li>upload malware or try to break into accounts or systems;</li>
          <li>
            copy, resell or scrape the service, or use it to build a competing
            product;
          </li>
          <li>send spam or overload the service with automated requests.</li>
        </ul>
        <p>We may suspend accounts that break these rules.</p>
      </>
    ),
  },
  {
    id: "plans-billing",
    title: "Plans, billing and taxes",
    body: (
      <ul>
        <li>
          Prices are shown in Indian rupees on our{" "}
          <Link href="/pricing">pricing page</Link>. GST and other applicable
          taxes are added where required.
        </li>
        <li>
          Paid plans are billed monthly in advance through our payment partner,
          Razorpay, and renew automatically until you cancel.
        </li>
        <li>
          If a payment fails, we will remind you. If it still isn&apos;t paid
          after 7 days, your workspace may move to the Free plan. Nothing is
          deleted.
        </li>
        <li>
          We will give you at least 30 days&apos; notice by email before we
          change the price of your plan.
        </li>
        <li>
          Each plan has limits, such as the number of active projects, as shown
          on the pricing page.
        </li>
      </ul>
    ),
  },
  {
    id: "service-delivery",
    title: "Delivery of the service",
    body: (
      <p>
        {site.name} is an online service. Nothing is shipped. Paid features are
        available in your account as soon as your payment is confirmed, and you
        receive a confirmation and invoice by email.
      </p>
    ),
  },
  {
    id: "cancellation",
    title: "Cancellation and refunds",
    body: (
      <p>
        You can cancel a paid plan at any time from Settings. How cancellations
        and refunds work is explained in our{" "}
        <Link href="/refunds">Refund and cancellation policy</Link>.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    body: (
      <p>
        We work to keep {site.name} available and your data safe, but we
        can&apos;t promise the service will never be interrupted. We may
        improve, change or remove features. If we remove something important
        that you pay for, we will tell you in advance.
      </p>
    ),
  },
  {
    id: "ending",
    title: "Closing your account",
    body: (
      <p>
        You can close your account at any time. We may suspend or close an
        account that breaks these terms, after warning you where reasonable.
        After an account is closed, you can ask us for an export of your content
        for 30 days, after which we delete it as described in our{" "}
        <Link href="/privacy">Privacy policy</Link>.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Disclaimers and limits on liability",
    body: (
      <>
        <p>
          The service is provided &ldquo;as is&rdquo;. To the extent the law
          allows, we are not liable for indirect or consequential losses, such
          as lost profits, lost clients or a client refusing to pay.
        </p>
        <p>
          Our total liability for any claim relating to {site.name} is limited
          to the amount you paid us in the three months before the claim arose.
          Nothing in these terms limits liability that cannot be limited under
          Indian law.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of India. Courts in {legal.city},{" "}
        {legal.state} have exclusive jurisdiction over any dispute, subject to
        any rights you have under consumer protection law.
      </p>
    ),
  },
  {
    id: "grievances",
    title: "Grievances and contact",
    body: (
      <p>
        If you have a complaint, write to our Grievance Officer,{" "}
        {legal.grievanceOfficer.name}, at {legal.grievanceOfficer.email}. We
        acknowledge complaints within 24 hours and aim to resolve them within 15
        days. For anything else, see our <Link href="/contact">Contact</Link>{" "}
        page.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. If a change matters, we will email you at
        least 15 days before it takes effect. The date at the top shows when
        they last changed.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of service"
      intro={
        <p>
          These terms explain what you can expect from {site.name} and what we
          expect from you. We&apos;ve kept them as plain as we can.
        </p>
      }
      sections={sections}
    />
  );
}
