import type { CSSProperties } from "react";
import { formatDate } from "@/shared/lib/dates";
import { initialsOf } from "@/shared/lib/initials";
import { formatMoney, type Minor } from "@/shared/lib/money";
import { formatPhone } from "@/shared/lib/phone";
import { cn } from "@/shared/lib/utils";
import type { ChangeOrderData } from "../domain/document-data";
import { gstOver } from "../domain/gst";
import { NO_IMAGES, type DocumentImages } from "../domain/images";
import { documentPalette, type DocumentStyle } from "../domain/style";
import { documentSerif } from "./fonts";

/**
 * A change request as a short document in the same style as the proposal:
 * what changes, what it costs, and how it's paid. Pure presentation, like
 * ClassicDocument, so it renders in the app, the client portal and print.
 */
export function ChangeOrderDocument({
  data,
  style,
  images = NO_IMAGES,
  className,
  approved = false,
  titleAs: Title = "h1",
}: {
  /** "h2" when the page around it already has an h1 (the app's CR page). */
  titleAs?: "h1" | "h2";
  data: ChangeOrderData;
  /** Already approved: the closing line says so instead of asking. */
  approved?: boolean;
  style: DocumentStyle;
  images?: DocumentImages;
  className?: string;
}) {
  const palette = documentPalette(style);
  const vars = {
    "--doc-accent": palette.accent,
    "--doc-accent-text": palette.accentText,
    "--doc-soft": palette.soft,
    "--doc-soft-text": palette.softText,
    "--doc-cover-bg": palette.coverBg,
    "--doc-cover-text": palette.coverText,
    "--doc-cover-muted": palette.coverMuted,
    "--doc-cover-label": palette.coverLabel,
    "--doc-cover-rule": palette.coverRule,
  } as CSSProperties;
  const headingFont =
    style.headingFont === "serif"
      ? "font-(family-name:--font-doc-serif) font-semibold tracking-[-0.01em]"
      : "font-sans font-semibold tracking-[-0.02em]";
  const money = (amount: Minor) => formatMoney(amount, data.currency);
  const gst = gstOver([data.total], data.gstPercent);
  const photo =
    style.cover === "image" && images.coverUrl
      ? {
          backgroundImage: `linear-gradient(rgb(15 16 20 / 0.72), rgb(15 16 20 / 0.86)), url(${JSON.stringify(images.coverUrl)})`,
        }
      : undefined;

  return (
    <article
      className={cn(
        documentSerif.variable,
        "@container overflow-hidden bg-white text-[#1d1f24] [print-color-adjust:exact]",
        className,
      )}
      style={vars}
    >
      <header
        className="bg-(--doc-cover-bg) bg-cover bg-center px-6 pt-8 pb-7 text-(--doc-cover-text) @xl:px-12 @xl:pt-10"
        style={photo}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex min-w-0 items-center gap-3">
            {style.showLogo &&
              (images.logoUrl ? (
                <span
                  className={cn(
                    "flex h-10 shrink-0 items-center rounded-md",
                    style.cover !== "light" && "bg-white px-2 py-1.5",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- signed R2 URL, already resized at upload */}
                  <img
                    src={images.logoUrl}
                    alt={`${data.business.name} logo`}
                    className="h-full w-auto max-w-[8rem] object-contain"
                  />
                </span>
              ) : (
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-md border border-(--doc-cover-rule) text-[12px] font-semibold tracking-wide"
                >
                  {initialsOf(data.business.name)}
                </span>
              ))}
            <p
              className={cn(
                "truncate text-[1.2rem] leading-tight",
                headingFont,
              )}
            >
              {data.business.name}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] tracking-[0.2em] text-(--doc-cover-label) uppercase">
              Change request
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              {data.reference}
            </p>
          </div>
        </div>

        <Title
          className={cn(
            "mt-9 max-w-[90%] text-[1.9rem] leading-[1.08] text-balance @xl:text-[2.4rem]",
            headingFont,
          )}
        >
          {data.title}
        </Title>

        <dl className="mt-7 grid gap-4 border-t border-(--doc-cover-rule) pt-5 text-sm @md:grid-cols-3">
          <Meta label="For">
            {data.client
              ? (data.client.company ?? data.client.name)
              : "Your client"}
          </Meta>
          <Meta label="Project">
            {data.projectTitle}
            <span className="block text-xs text-(--doc-cover-muted) tabular-nums">
              Proposal {data.projectReference}
            </span>
          </Meta>
          <Meta label="Issued">
            {formatDate(data.issuedOn, { withYear: true })}
          </Meta>
        </dl>
      </header>

      <div className="grid gap-8 px-6 py-8 @xl:px-12 @xl:py-10">
        {data.description && (
          <div className="grid max-w-[68ch] gap-3 text-[0.95rem] leading-relaxed text-pretty text-[#3a3d44]">
            {data.description
              .split(/\n{2,}/)
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p.trim()}
                </p>
              ))}
          </div>
        )}

        <table className="w-full border-collapse text-[0.9rem]">
          <thead>
            <tr className="border-b border-[#1d1f24] text-left text-[11px] tracking-[0.14em] text-[#6b6f78] uppercase">
              <th className="py-2 font-medium">What changes</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id} className="border-b border-[#ece9e3] align-top">
                <td className="py-2.5 pr-3">
                  <span className="font-medium">{item.title}</span>
                  {item.description && (
                    <span className="mt-0.5 block text-[0.82rem] leading-relaxed text-pretty text-[#565a63]">
                      {item.description}
                    </span>
                  )}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {money(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid break-inside-avoid items-stretch gap-4 @xl:grid-cols-[1fr_1.2fr]">
          <div className="grid content-center gap-1 rounded-xl bg-(--doc-cover-bg) px-6 py-5 text-(--doc-cover-text)">
            <p className="text-[11px] tracking-[0.2em] text-(--doc-cover-label) uppercase">
              This change
            </p>
            <p
              className={cn(
                "text-[2.2rem] leading-none tabular-nums",
                headingFont,
              )}
            >
              {money(data.total)}
            </p>
            {gst && (
              <p className="text-sm tabular-nums">
                <span className="font-medium">
                  plus {data.gstPercent}% GST ({money(gst.tax)})
                </span>{" "}
                · {money(gst.total)} with GST
              </p>
            )}
          </div>
          <div className="grid content-center gap-2 rounded-xl border border-[#e7e4dd] px-5 py-4 text-[0.88rem] leading-relaxed text-pretty">
            <p>
              <span className="mb-0.5 block text-[11px] tracking-[0.14em] text-(--doc-soft-text) uppercase">
                How it&apos;s paid
              </span>
              {data.billing}
            </p>
            <p className="text-[#565a63]">
              The original proposal ({money(data.originalTotal)}) stays as
              agreed.{" "}
              {approved
                ? "This was approved and is added on top."
                : "This is added on top only if you approve it."}
            </p>
          </div>
        </div>

        <footer className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[#e7e4dd] pt-5 text-xs text-[#6b6f78]">
          <p>
            {data.business.name}
            {data.business.email ? ` · ${data.business.email}` : ""}
            {data.business.phone
              ? ` · ${formatPhone(data.business.phone)}`
              : ""}
          </p>
          <p className="tabular-nums">
            {data.reference} · Proposal {data.projectReference}
          </p>
        </footer>
      </div>
    </article>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-[11px] tracking-[0.2em] text-(--doc-cover-label) uppercase">
        {label}
      </dt>
      <dd className="font-semibold break-words">{children}</dd>
    </div>
  );
}
