import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalStatementPage, portalTitle } from "@/modules/portal/server";

export async function generateMetadata({
  params,
}: PageProps<"/c/[token]/statement">): Promise<Metadata> {
  const title = await portalTitle((await params).token, { kind: "statement" });
  return { title: title ? { absolute: title } : "Project statement" };
}

export default function ClientStatementPage({
  params,
}: PageProps<"/c/[token]/statement">) {
  return (
    <Suspense
      fallback={
        <div aria-hidden className="mx-auto grid max-w-[210mm] gap-6 px-4 py-8">
          <div className="h-14 bg-white/80" />
          <div className="h-[70vh] bg-white" />
        </div>
      }
    >
      <Statement params={params} />
    </Suspense>
  );
}

async function Statement({
  params,
}: Pick<PageProps<"/c/[token]/statement">, "params">) {
  const { token } = await params;
  return <PortalStatementPage token={token} />;
}
