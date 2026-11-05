import type { Metadata } from "next";

/**
 * Full-page documents (proposal preview, later change orders and invoices):
 * no app shell, so what you see is what prints. Still signed-in only: the
 * proxy and each page's requireWorkspace() guard it.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DocumentLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh bg-[#ebe8e2] print:bg-white">{children}</div>
  );
}
