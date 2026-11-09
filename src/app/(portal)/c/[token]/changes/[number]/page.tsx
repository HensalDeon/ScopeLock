import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalChangePage, portalTitle } from "@/modules/portal/server";

export async function generateMetadata({
  params,
}: PageProps<"/c/[token]/changes/[number]">): Promise<Metadata> {
  const { token, number } = await params;
  const title = await portalTitle(token, { kind: "change", number: number });
  return { title: title ? { absolute: title } : "Change request" };
}

export default function ClientChangePage({
  params,
}: PageProps<"/c/[token]/changes/[number]">) {
  return (
    <Suspense fallback={<ChangeSkeleton />}>
      <Change params={params} />
    </Suspense>
  );
}

async function Change({
  params,
}: {
  params: PageProps<"/c/[token]/changes/[number]">["params"];
}) {
  const { token, number } = await params;
  return <PortalChangePage token={token} number={number} />;
}

function ChangeSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-[210mm] px-0 sm:px-4 sm:py-8">
      <div className="h-14 bg-white/80" />
      <div className="h-56 bg-[#1d1f24]/80 sm:rounded-t-sm" />
      <div className="h-72 bg-white sm:rounded-b-sm" />
    </div>
  );
}
