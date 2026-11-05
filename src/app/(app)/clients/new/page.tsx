import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientForm } from "@/modules/clients";
import { safeNextPath } from "@/shared/auth/redirect";
import { BackLink } from "@/shared/ui/back-link";
import { PageContainer, PageHeader } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Add client" };

export default function NewClientPage({
  searchParams,
}: PageProps<"/clients/new">) {
  return (
    <PageContainer className="max-w-2xl">
      <BackLink href="/clients" className="mb-3">
        Clients
      </BackLink>
      <PageHeader
        title="Add a client"
        description="Only the name is required. Add a WhatsApp number to send approval links in one tap."
      />
      <Suspense fallback={<div className="h-80 rounded-xl bg-canvas" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function Form({
  searchParams,
}: {
  searchParams: PageProps<"/clients/new">["searchParams"];
}) {
  const { next } = await searchParams;
  const back = typeof next === "string" ? safeNextPath(next, "") : "";
  return (
    <ClientForm
      mode="create"
      next={back}
      cancelHref={back === "/projects/new" ? "/projects/new" : "/clients"}
    />
  );
}
