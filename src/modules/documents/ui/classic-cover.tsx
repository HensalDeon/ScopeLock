import type { ReactNode } from "react";
import { formatDate } from "@/shared/lib/dates";
import { initialsOf } from "@/shared/lib/initials";
import { formatPhone } from "@/shared/lib/phone";
import { cn } from "@/shared/lib/utils";
import type { ProposalDocumentData } from "../domain/document-data";
import type { DocumentImages } from "../domain/images";
import type { DocumentStyle } from "../domain/style";

/** The proposal's cover: business, title, who it's for, dates. */
export function Cover({
  data,
  style,
  images,
  headingFont,
}: {
  data: ProposalDocumentData;
  style: DocumentStyle;
  images: DocumentImages;
  headingFont: string;
}) {
  // The photo sits under a dark layer so text stays readable even on a very
  // bright photo (a pure white image ends up around #525254: white text
  // ~7.9:1, accent labels ≥ 4.5:1). No photo uploaded → plain dark cover.
  const photo =
    style.cover === "image" && images.coverUrl
      ? {
          backgroundImage: `linear-gradient(rgb(15 16 20 / 0.72), rgb(15 16 20 / 0.86)), url(${JSON.stringify(images.coverUrl)})`,
        }
      : undefined;
  return (
    <header
      className="relative overflow-hidden bg-(--doc-cover-bg) bg-cover bg-center px-6 pt-9 pb-8 text-(--doc-cover-text) @xl:px-12 @xl:pt-11 @xl:pb-9"
      style={photo}
    >
      {style.coverPattern && (
        // Both rings are centred on the top-right corner. Their sizes keep
        // the "Proposal" label inside the inner ring and the brand and title
        // outside the outer one, so no line runs through text. Smaller on
        // narrow pages (phones), A4 size from @xl.
        <div aria-hidden className="pointer-events-none">
          <div className="absolute -top-[175px] -right-[175px] size-[350px] rounded-full border border-(--doc-ring) @xl:-top-65 @xl:-right-65 @xl:size-130" />
          <div className="absolute -top-35 -right-35 size-70 rounded-full border border-(--doc-ring) @xl:-top-[205px] @xl:-right-[205px] @xl:size-[410px]" />
        </div>
      )}

      <div className="relative flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          {style.showLogo &&
            (images.logoUrl ? (
              // Most logos are dark artwork: on dark, accent or photo covers
              // they sit on a white plate so they stay visible.
              <span
                className={cn(
                  "flex h-11 shrink-0 items-center rounded-md",
                  style.cover !== "light" && "bg-white px-2 py-1.5",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- signed R2 URL, already resized at upload */}
                <img
                  src={images.logoUrl}
                  alt={`${data.business.name} logo`}
                  className="h-full w-auto max-w-[9rem] object-contain"
                />
              </span>
            ) : (
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-md border border-(--doc-cover-rule) text-[13px] font-semibold tracking-wide"
              >
                {initialsOf(data.business.name)}
              </span>
            ))}
          <div className="min-w-0">
            <p className={cn("text-[1.35rem] leading-tight", headingFont)}>
              {data.business.name}
            </p>
            {data.business.tagline && (
              <p className="mt-0.5 text-[10px] font-medium tracking-[0.2em] text-(--doc-cover-label) uppercase">
                {data.business.tagline}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] tracking-[0.2em] text-(--doc-cover-label) uppercase">
            Proposal
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">
            {data.reference}
          </p>
        </div>
      </div>

      <h1
        className={cn(
          "relative mt-12 max-w-[85%] text-[2.1rem] leading-[1.06] text-balance @xl:mt-14 @xl:text-[2.85rem]",
          headingFont,
        )}
      >
        {data.title}
      </h1>
      {data.subtitle && (
        <p className="relative mt-3 max-w-[60ch] text-[0.95rem] leading-relaxed text-pretty text-(--doc-cover-muted)">
          {data.subtitle}
        </p>
      )}

      <dl className="relative mt-9 grid gap-5 border-t border-(--doc-cover-rule) pt-5 @md:grid-cols-3">
        <CoverItem label="Prepared for">
          {data.client ? (
            <>
              <strong>{data.client.company ?? data.client.name}</strong>
              {data.client.company && <em>{data.client.name}</em>}
              {data.client.email && <em>{data.client.email}</em>}
              {data.client.phone && <em>{formatPhone(data.client.phone)}</em>}
            </>
          ) : (
            <strong>Your client</strong>
          )}
        </CoverItem>
        <CoverItem label="Prepared by">
          <strong>{data.business.name}</strong>
          {data.business.email && <em>{data.business.email}</em>}
          {data.business.phone && <em>{formatPhone(data.business.phone)}</em>}
        </CoverItem>
        <CoverItem label="Issued">
          <strong>{formatDate(data.issuedOn, { withYear: true })}</strong>
          {data.validUntil && (
            <>
              <span className="mt-3 block text-[10px] tracking-[0.2em] text-(--doc-cover-label) uppercase">
                Valid until
              </span>
              <strong>{formatDate(data.validUntil, { withYear: true })}</strong>
            </>
          )}
        </CoverItem>
      </dl>
    </header>
  );
}

function CoverItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 [&_em]:block [&_em]:text-xs [&_em]:break-words [&_em]:text-(--doc-cover-muted) [&_em]:not-italic [&_strong]:block [&_strong]:text-sm [&_strong]:font-semibold">
      <dt className="mb-1 text-[10px] tracking-[0.2em] text-(--doc-cover-label) uppercase">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
