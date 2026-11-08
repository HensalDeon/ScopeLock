import { Suspense } from "react";
import { PortalPage } from "@/modules/portal/server";

export default function ClientPortalPage({ params }: PageProps<"/c/[token]">) {
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <Portal params={params} />
    </Suspense>
  );
}

async function Portal({
  params,
}: {
  params: PageProps<"/c/[token]">["params"];
}) {
  const { token } = await params;
  return <PortalPage token={token} />;
}

function PortalSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-[210mm] px-0 sm:px-4 sm:py-8">
      <div className="h-14 bg-white/80" />
      <div className="h-72 bg-[#1d1f24]/80 sm:rounded-t-sm" />
      <div className="h-96 bg-white sm:rounded-b-sm" />
    </div>
  );
}
