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
        eyebrow="Contact"
        title="Talk to a person."
        intro="Questions about your account, billing or a client link? Email us and a real person replies, usually within one business day."
      />

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="grid content-start gap-6">
          <div className="grid gap-1.5">
            <p className="text-sm text-muted-foreground">Support and billing</p>
            <p className="text-xl font-semibold tracking-tight">
              {legal.email}
            </p>
          </div>
          <div className="grid gap-1.5">
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="text-xl font-semibold tracking-tight tabular-nums">
              {legal.phone}
            </p>
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
        <BusinessDetails />
      </div>
    </Container>
  );
}
