import type { Metadata } from "next";
import {
  BusinessDetails,
  Container,
  SectionHeading,
} from "@/modules/marketing";
import { legal, site } from "@/shared/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `How to reach the team behind ${site.name}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Container className="py-14 sm:py-20">
      <SectionHeading
        as="h1"
        title="Talk to a person."
        intro="Questions about your account, billing or a client link? Email us and a real person replies, usually within one business day."
      />
      <p className="mt-6 max-w-prose rounded-lg border bg-canvas px-4 py-3 text-[15px] text-pretty">
        Got a link from your freelancer or studio? Questions about the work or
        the price go to them: their name and number are on the page you opened.
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="grid content-start gap-6">
          <div className="grid gap-1.5">
            <p className="text-sm text-muted-foreground">Support and billing</p>
            <a
              href={`mailto:${legal.email}`}
              className="w-fit text-xl font-semibold tracking-tight underline-offset-4 hover:underline"
            >
              {legal.email}
            </a>
          </div>
          <div className="grid gap-1.5">
            <p className="text-sm text-muted-foreground">Phone</p>
            <a
              href={`tel:${legal.phone.replace(/[^\d+]/g, "")}`}
              className="w-fit text-xl font-semibold tracking-tight tabular-nums underline-offset-4 hover:underline"
            >
              {legal.phone}
            </a>
            <p className="text-sm text-muted-foreground">
              {legal.supportHours}
            </p>
          </div>
          <div className="grid gap-1.5 border-t pt-6">
            <p className="text-sm font-medium">Grievance Officer</p>
            <p className="text-[15px] text-muted-foreground">
              {legal.grievanceOfficer.name} · {legal.grievanceOfficer.email}
            </p>
            <p className="text-sm text-muted-foreground">
              Complaints are acknowledged within 24 hours and resolved within 15
              days.
            </p>
          </div>
        </div>
        <BusinessDetails compact />
      </div>
    </Container>
  );
}
