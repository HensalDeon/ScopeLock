import type { Metadata } from "next";
import { Suspense } from "react";
import {
  DocumentStyleEditor,
  ProposalDefaultsForm,
  sampleProposal,
} from "@/modules/documents";
import {
  getDocumentImages,
  getDocumentSettings,
} from "@/modules/documents/server";
import { isStorageConfigured } from "@/shared/lib/env";
import { BUSINESS_TYPE_LABELS } from "@/modules/workspace";
import { requireWorkspace } from "@/modules/workspace/server";
import { Section } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Document settings" };

export default function DocumentSettingsPage() {
  return (
    <Suspense fallback={<div className="h-160 rounded-xl bg-canvas" />}>
      <DocumentSettings />
    </Suspense>
  );
}

async function DocumentSettings() {
  const [{ workspace, user }, settings] = await Promise.all([
    requireWorkspace(),
    getDocumentSettings(),
  ]);
  const business = {
    name: workspace.businessName,
    tagline: BUSINESS_TYPE_LABELS[workspace.businessType].title,
    email: user.email,
    phone: workspace.phone,
  };
  const voice = workspace.businessType === "freelancer" ? "I" : "we";
  // A full sample, so every section can be seen in the chosen style. It uses
  // the saved default text, so saving defaults below shows up here too.
  const preview = sampleProposal(business, voice, settings.defaults);
  const images = await getDocumentImages(settings);

  return (
    <div className="grid gap-12">
      <section aria-labelledby="style-title" className="grid gap-5">
        <div className="grid gap-1">
          <h2 id="style-title" className="text-[15px] font-semibold">
            Document style
          </h2>
          <p className="max-w-prose text-sm text-pretty text-muted-foreground">
            How your proposals look to clients. Change requests use the same
            style; invoices use the accent colour only. The preview is a sample
            with every section filled in.
          </p>
        </div>
        <DocumentStyleEditor
          initial={settings.style}
          preview={preview}
          images={images}
          uploadsEnabled={isStorageConfigured()}
        />
      </section>

      <div className="max-w-4xl">
        <Section
          title="Default text"
          description="Pre-filled on every new project. You can change or clear it per project."
        >
          <ProposalDefaultsForm initial={settings.defaults} />
        </Section>
      </div>
    </div>
  );
}
