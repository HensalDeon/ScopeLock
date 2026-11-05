import type { Metadata } from "next";
import { Suspense } from "react";
import {
  DocumentStyleEditor,
  ProposalDefaultsForm,
  sampleProposal,
} from "@/modules/documents";
import { getDocumentSettings } from "@/modules/documents/server";
import { listProjects, toProposalDocument } from "@/modules/projects/server";
import { BUSINESS_TYPE_LABELS } from "@/modules/workspace";
import { requireWorkspace } from "@/modules/workspace/server";
import { Section } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Document settings" };

export default function DocumentSettingsPage() {
  return (
    <Suspense fallback={<div className="h-[40rem] rounded-xl bg-canvas" />}>
      <DocumentSettings />
    </Suspense>
  );
}

async function DocumentSettings() {
  const [{ workspace, user }, settings, projects] = await Promise.all([
    requireWorkspace(),
    getDocumentSettings(),
    listProjects(),
  ]);
  const business = {
    name: workspace.businessName,
    tagline: BUSINESS_TYPE_LABELS[workspace.businessType].title,
    email: user.email,
    phone: workspace.phone,
  };
  const voice = workspace.businessType === "freelancer" ? "I" : "we";
  // Preview with real content when there is some.
  const latest = projects[0];
  const preview = latest
    ? toProposalDocument(latest, { ...business, voice })
    : sampleProposal(business, voice);

  return (
    <div className="grid gap-12">
      <section aria-labelledby="style-title" className="grid gap-5">
        <div className="grid gap-1">
          <h2 id="style-title" className="text-[15px] font-semibold">
            Document style
          </h2>
          <p className="max-w-prose text-sm text-pretty text-muted-foreground">
            How your proposals look to clients. The same style is used for
            change orders and invoices.
            {latest
              ? ` Previewing “${latest.name}”.`
              : " Previewing a sample proposal."}
          </p>
        </div>
        <DocumentStyleEditor initial={settings.style} preview={preview} />
      </section>

      <div className="max-w-4xl">
        <Section
          title="Default text"
          description="Pre-filled on every new project. You can change it per project."
        >
          <ProposalDefaultsForm initial={settings.defaults} />
        </Section>
      </div>
    </div>
  );
}
