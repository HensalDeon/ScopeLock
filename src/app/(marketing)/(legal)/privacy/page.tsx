import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/modules/marketing";
import { legal, site } from "@/shared/config/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `What personal data ${site.name} collects, why, and the choices you have.`,
  alternates: { canonical: "/privacy" },
};

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <p>
        {legal.businessName} (&ldquo;we&rdquo;) runs {site.name} and decides how
        your personal data is used. Under India&apos;s Digital Personal Data
        Protection Act, 2023, we are the Data Fiduciary for your account data.
        You can reach us at {legal.email}.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <p>
          <strong>From you, when you use {site.name}:</strong>
        </p>
        <ul>
          <li>
            Account details: your name, email address and a hashed password, or
            your Google profile if you sign in with Google.
          </li>
          <li>
            Business details: business name, type, WhatsApp number, logo and the
            payment details you choose to show clients (such as a UPI ID or bank
            account).
          </li>
          <li>
            Project content: clients, deliverables, prices, change requests,
            milestones and payment records you add.
          </li>
          <li>
            Subscription billing: your plan and invoices. Card and bank details
            are handled by Razorpay; we never see or store them.
          </li>
        </ul>
        <p>
          <strong>From your clients, when they open a link you send:</strong>
        </p>
        <ul>
          <li>The name and email they enter when approving or declining.</li>
          <li>
            Their decision, any comment, the date and time, IP address, and
            browser and device type, kept as part of the approval record.
          </li>
          <li>
            Payment references and screenshots they upload to show they paid
            you.
          </li>
        </ul>
        <p>
          <strong>Automatically:</strong> basic logs (IP address, browser, pages
          requested, errors) to keep the service secure and working.
        </p>
      </>
    ),
  },
  {
    id: "why",
    title: "Why we use it",
    body: (
      <ul>
        <li>To run your account and the features you use.</li>
        <li>
          To show your clients what you sent them and record their response.
        </li>
        <li>
          To send emails you need: sign-in, approvals, payment updates and
          billing.
        </li>
        <li>To bill paid plans and meet tax and accounting requirements.</li>
        <li>To keep the service secure, prevent misuse and fix problems.</li>
      </ul>
    ),
  },
  {
    id: "consent",
    title: "Consent and legal basis",
    body: (
      <p>
        We process your data because you asked us to provide the service and
        agreed to this policy when you signed up, and where the law requires it
        (for example, keeping invoices). You can withdraw consent by closing
        your account; this doesn&apos;t affect processing that already happened.
      </p>
    ),
  },
  {
    id: "your-clients",
    title: "Your clients' data",
    body: (
      <p>
        When you add a client or send them a link, we process their personal
        data on your instructions so you can run your projects. Please let your
        clients know you use {site.name} to share scope, change requests and
        payment details with them. If a client asks us about their data, we will
        refer them to you and help you respond.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>
          We do not sell your data or use it for advertising. We share it only
          with service providers that help us run {site.name}, under contracts
          that protect it:
        </p>
        <ul>
          <li>MongoDB Atlas: database hosting.</li>
          <li>Vercel or our hosting provider: running the application.</li>
          <li>
            Cloudflare R2: storing files such as logos, PDFs and payment proofs.
          </li>
          <li>
            Our email provider: delivering account and notification emails.
          </li>
          <li>Razorpay: processing subscription payments.</li>
        </ul>
        <p>
          We may also disclose data when required by Indian law or a valid order
          from a government authority.
        </p>
      </>
    ),
  },
  {
    id: "storage",
    title: "Where it's stored and how it's protected",
    body: (
      <p>
        Data is stored with our providers, which may be located inside or
        outside India, with protections required by law. Data is encrypted in
        transit and at rest. Client links use long random codes, and only a
        fingerprint of each code is stored. Access to production data within our
        team is limited to what is needed to support you.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Account and project data: while your account is open.</li>
        <li>
          After you close your account: 30 days so you can request an export,
          then deleted from live systems. Backups roll off within a further 30
          days.
        </li>
        <li>
          Invoices and billing records: as long as Indian tax law requires
          (usually 8 years).
        </li>
        <li>Security logs: up to 90 days.</li>
      </ul>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the Digital Personal Data Protection Act, 2023, you can:</p>
        <ul>
          <li>
            ask what personal data we hold about you and how it&apos;s used;
          </li>
          <li>correct, complete or update it;</li>
          <li>
            ask us to erase it, subject to what the law requires us to keep;
          </li>
          <li>
            nominate someone to exercise these rights if you are unable to;
          </li>
          <li>
            raise a grievance with us, and then with the Data Protection Board
            of India.
          </li>
        </ul>
        <p>
          Most details can be changed in Settings. For anything else, email{" "}
          {legal.email}.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <p>
        We use only the cookies needed to keep you signed in and protect your
        account. We don&apos;t use advertising or cross-site tracking cookies.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        {site.name} is for businesses and people aged 18 or over. We don&apos;t
        knowingly collect data from children.
      </p>
    ),
  },
  {
    id: "grievance-officer",
    title: "Grievance Officer",
    body: (
      <p>
        {legal.grievanceOfficer.name}, {legal.businessName}, {legal.address}.
        Email: {legal.grievanceOfficer.email}. We acknowledge grievances within
        24 hours and aim to resolve them within 15 days. See also our{" "}
        <Link href="/contact">Contact</Link> page.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we change how we use personal data in a way that matters, we will
        email you before the change takes effect. The date at the top shows when
        this policy last changed.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy policy"
      intro={
        <p>
          {site.name} handles details about you and your clients. This policy
          explains what we collect, why, who can see it, and what you can ask us
          to do with it.
        </p>
      }
      sections={sections}
    />
  );
}
