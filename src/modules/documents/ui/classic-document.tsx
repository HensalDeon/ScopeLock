import { Check, X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { formatDate } from "@/shared/lib/dates";
import { initialsOf } from "@/shared/lib/initials";
import { formatINR } from "@/shared/lib/money";
import { formatPhone } from "@/shared/lib/phone";
import { cn } from "@/shared/lib/utils";
import type { ProposalDocumentData } from "../domain/document-data";
import { documentPalette, type DocumentStyle } from "../domain/style";
import { documentSerif } from "./fonts";

/**
 * "Classic" proposal template: dark (or tinted) cover, highlights strip and
 * numbered sections, modelled on the Estimator quotation builder.
 *
 * Pure presentation: no data fetching, no browser APIs, so the same component
 * renders the settings preview, "Preview as client", the client portal and
 * the printed A4 page. Layout responds to its own width (container queries),
 * not the screen's, so it looks right in a narrow preview pane too.
 */
export function ClassicDocument({
  data,
  style,
  className,
}: {
  data: ProposalDocumentData;
  style: DocumentStyle;
  className?: string;
}) {
  const palette = documentPalette(style);
  const vars = {
    "--doc-accent": palette.accent,
    "--doc-accent-text": palette.accentText,
    "--doc-on-accent": palette.onAccent,
    "--doc-soft": palette.soft,
    "--doc-soft-text": palette.softText,
    "--doc-cover-bg": palette.coverBg,
    "--doc-cover-text": palette.coverText,
    "--doc-cover-muted": palette.coverMuted,
    "--doc-cover-label": palette.coverLabel,
    "--doc-cover-rule": palette.coverRule,
    "--doc-ring": palette.ring,
  } as CSSProperties;
  const serif = style.headingFont === "serif";
  const headingFont = serif
    ? "font-(family-name:--font-doc-serif) font-semibold tracking-[-0.01em]"
    : "font-sans font-semibold tracking-[-0.02em]";

  const sections = buildSections(data, headingFont);

  return (
    <article
      className={cn(
        documentSerif.variable,
        "@container overflow-hidden bg-white text-[#1d1f24] [print-color-adjust:exact]",
        className,
      )}
      style={vars}
    >
      <Cover data={data} style={style} headingFont={headingFont} />

      {data.highlights.length > 0 && (
        <div className="grid grid-cols-2 border-b border-[#e7e4dd] bg-(--doc-soft) @xl:auto-cols-fr @xl:grid-flow-col @xl:grid-cols-none">
          {data.highlights.map((h, i) => (
            <div
              key={`${h.label}-${i}`}
              className="border-r border-b border-[#e7e4dd] px-3 py-4 text-center last:border-r-0 @xl:border-b-0"
            >
              <p
                className={cn(
                  "text-[1.6rem] leading-none text-[#1d1f24]",
                  headingFont,
                )}
              >
                {h.value}
              </p>
              <p className="mt-1.5 text-[10px] font-medium tracking-[0.16em] text-(--doc-soft-text) uppercase">
                {h.label}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-10 px-6 py-9 @xl:px-12 @xl:py-12">
        {sections.map((section, index) => (
          <section
            key={section.title}
            className="grid break-inside-avoid-page gap-4"
          >
            <h2
              className={cn(
                "flex items-baseline gap-3 text-[1.55rem] leading-tight text-[#1d1f24] @xl:text-[1.85rem]",
                headingFont,
              )}
            >
              <span className="font-sans text-xs font-semibold tracking-normal text-(--doc-accent-text) tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              {section.title}
            </h2>
            {section.body}
          </section>
        ))}

        <footer className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t border-[#e7e4dd] pt-5 text-xs text-[#6b6f78]">
          <p>
            {data.business.name}
            {data.business.email ? ` · ${data.business.email}` : ""}
            {data.business.phone
              ? ` · ${formatPhone(data.business.phone)}`
              : ""}
          </p>
          <p className="tabular-nums">Proposal {data.reference}</p>
        </footer>
      </div>
    </article>
  );
}

function Cover({
  data,
  style,
  headingFont,
}: {
  data: ProposalDocumentData;
  style: DocumentStyle;
  headingFont: string;
}) {
  return (
    <header className="relative overflow-hidden bg-(--doc-cover-bg) px-6 pt-9 pb-8 text-(--doc-cover-text) @xl:px-12 @xl:pt-11 @xl:pb-9">
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
          {style.showLogo && (
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-md border border-(--doc-cover-rule) text-[13px] font-semibold tracking-wide"
            >
              {initialsOf(data.business.name)}
            </span>
          )}
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

type Section = { title: string; body: ReactNode };

function buildSections(
  data: ProposalDocumentData,
  headingFont: string,
): Section[] {
  const sections: Section[] = [];
  const paragraphs = (text: string) =>
    text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p, i) => (
        <p key={i} className="leading-relaxed text-pretty whitespace-pre-line">
          {p}
        </p>
      ));

  if (data.overview || data.callout) {
    sections.push({
      title: "Project overview",
      body: (
        <div className="grid max-w-[68ch] gap-3 text-[0.95rem] text-[#3a3d44]">
          {data.overview && paragraphs(data.overview)}
          {data.callout && (
            <p className="border-l-[3px] border-(--doc-accent) bg-(--doc-soft) px-4 py-3 text-[0.9rem] leading-relaxed text-pretty text-[#2a2d33]">
              {data.callout}
            </p>
          )}
        </div>
      ),
    });
  }

  sections.push({
    title: "What's included",
    body: (
      <div className="grid gap-3 @xl:grid-cols-2">
        {data.items.map((item, i) => (
          <div
            key={item.id}
            className="grid break-inside-avoid content-start gap-2 rounded-xl border border-[#e7e4dd] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--doc-soft) text-[11px] font-semibold text-(--doc-soft-text) tabular-nums">
                {i + 1}
              </span>
              <h3 className="min-w-0 flex-1 text-[0.95rem] leading-snug font-semibold">
                {item.title}
              </h3>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {formatINR(item.amount)}
              </p>
            </div>
            {item.description && (
              <p className="pl-9 text-[0.85rem] leading-relaxed text-pretty text-[#565a63]">
                {item.description}
              </p>
            )}
            {item.includes.length > 0 && (
              <ul className="grid gap-1.5 pl-9 text-[0.85rem] text-[#3a3d44]">
                {item.includes.map((point, j) => (
                  <li key={j} className="flex gap-2">
                    <Check
                      aria-hidden
                      className="mt-[3px] size-3.5 shrink-0 text-(--doc-accent-text)"
                    />
                    <span className="text-pretty">{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    ),
  });

  sections.push({
    title: "Investment",
    body: (
      <div className="grid break-inside-avoid items-start gap-4 @xl:grid-cols-[1.4fr_1fr]">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="border-b border-[#1d1f24] text-left text-[10px] tracking-[0.14em] text-[#6b6f78] uppercase">
              <th className="py-2 font-medium">Deliverable</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id} className="border-b border-[#ece9e3]">
                <td className="py-2 pr-3">{item.title}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatINR(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-2.5 font-semibold">Total</td>
              <td className="pt-2.5 text-right font-semibold tabular-nums">
                {formatINR(data.total)}
              </td>
            </tr>
          </tfoot>
        </table>
        <div className="grid content-center gap-1 rounded-xl bg-(--doc-cover-bg) px-6 py-6 text-(--doc-cover-text)">
          <p className="text-[10px] tracking-[0.2em] text-(--doc-cover-label) uppercase">
            Total investment
          </p>
          <p
            className={cn(
              "text-[2.4rem] leading-none tabular-nums",
              headingFont,
            )}
          >
            {formatINR(data.total)}
          </p>
          <p className="mt-1 text-xs text-(--doc-cover-muted)">
            For the scope above. Anything extra is quoted separately before work
            starts.
          </p>
        </div>
      </div>
    ),
  });

  sections.push({
    title: "Payment schedule",
    body: (
      <table className="w-full border-collapse break-inside-avoid text-[0.85rem]">
        <thead>
          <tr className="border-b border-[#1d1f24] text-left text-[10px] tracking-[0.14em] text-[#6b6f78] uppercase">
            <th className="py-2 font-medium">Payment</th>
            <th className="py-2 text-right font-medium">Share</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.billingModel === "upfront" ? (
            <tr className="border-b border-[#ece9e3]">
              <td className="py-2.5 pr-3">
                <strong className="font-semibold">Full payment</strong>
                <span className="block text-xs text-[#6b6f78]">
                  Before work starts
                </span>
              </td>
              <td className="py-2.5 text-right tabular-nums">100%</td>
              <td className="py-2.5 text-right font-semibold tabular-nums">
                {formatINR(data.total)}
              </td>
            </tr>
          ) : (
            data.milestones.map((m) => (
              <tr key={m.id} className="border-b border-[#ece9e3]">
                <td className="py-2.5 pr-3 font-semibold">{m.name}</td>
                <td className="py-2.5 text-right tabular-nums">{m.percent}%</td>
                <td className="py-2.5 text-right font-semibold tabular-nums">
                  {formatINR(m.amount)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    ),
  });

  if (data.timeline.length > 0) {
    sections.push({
      title: "Timeline",
      body: (
        <ol className="grid">
          {data.timeline.map((step, i) => (
            <li
              key={step.id}
              className="grid break-inside-avoid grid-cols-[5.5rem_minmax(0,1fr)] gap-4"
            >
              <p className="pt-px text-right text-[10px] font-semibold tracking-[0.08em] text-(--doc-accent-text) uppercase">
                {step.duration}
              </p>
              <div
                className={cn(
                  "relative border-l-2 border-[#e7e4dd] pb-5 pl-5",
                  i === data.timeline.length - 1 && "border-l-transparent",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1 -left-[7px] size-3 rounded-full border-2 border-white",
                    step.isMilestone ? "bg-(--doc-accent)" : "bg-[#cfcac0]",
                  )}
                />
                <h3 className="text-[0.9rem] font-semibold">
                  {step.phase}
                  {step.isMilestone && (
                    <span className="ml-2 rounded-full bg-(--doc-soft) px-2 py-0.5 text-[10px] font-medium tracking-wide text-(--doc-soft-text) uppercase">
                      Milestone
                    </span>
                  )}
                </h3>
                {step.description && (
                  <p className="mt-0.5 text-[0.85rem] leading-relaxed text-pretty text-[#565a63]">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      ),
    });
  }

  if (data.addons.length > 0) {
    sections.push({
      title: "Optional add-ons",
      body: (
        <div className="grid gap-3">
          <p className="text-[0.9rem] text-[#565a63]">
            Not part of the total above. Ask for any of these now or later, and{" "}
            {data.voice === "I" ? "I'll" : "we'll"} send it as a separate change
            for you to approve.
          </p>
          <table className="w-full border-collapse text-[0.85rem]">
            <tbody>
              {data.addons.map((addon) => (
                <tr
                  key={addon.id}
                  className="break-inside-avoid border-b border-[#ece9e3]"
                >
                  <td className="py-2.5 pr-3">
                    <strong className="font-semibold">{addon.title}</strong>
                    {addon.description && (
                      <span className="block text-xs text-[#6b6f78]">
                        {addon.description}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap tabular-nums">
                    <strong className="font-semibold">
                      {formatINR(addon.amount)}
                    </strong>
                    {addon.unit && (
                      <span className="ml-1 text-xs text-[#6b6f78]">
                        {addon.unit}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    });
  }

  if (data.clientProvides.length > 0 || data.exclusions.length > 0) {
    const we = data.voice === "I" ? "I" : "we";
    sections.push({
      title: "Before we start",
      body: (
        <div className="grid gap-6 @xl:grid-cols-2">
          {data.clientProvides.length > 0 && (
            <ListBlock
              title={`What ${we} need from you`}
              items={data.clientProvides}
              icon="check"
            />
          )}
          {data.exclusions.length > 0 && (
            <ListBlock title="Not included" items={data.exclusions} icon="x" />
          )}
        </div>
      ),
    });
  }

  if (data.terms.length > 0) {
    sections.push({
      title: "Terms",
      body: (
        <ol className="grid list-decimal gap-1.5 pl-5 text-[0.85rem] leading-relaxed text-[#3a3d44] marker:text-(--doc-accent-text) marker:tabular-nums">
          {data.terms.map((term, i) => (
            <li key={i} className="pl-1 text-pretty">
              {term}
            </li>
          ))}
        </ol>
      ),
    });
  }

  return sections;
}

function ListBlock({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: "check" | "x";
}) {
  const Icon = icon === "check" ? Check : X;
  return (
    <div className="break-inside-avoid">
      <h3 className="mb-2 text-[0.9rem] font-semibold">{title}</h3>
      <ul className="grid gap-1.5 text-[0.85rem] text-[#3a3d44]">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <Icon
              aria-hidden
              className={cn(
                "mt-[3px] size-3.5 shrink-0",
                icon === "check"
                  ? "text-(--doc-accent-text)"
                  : "text-[#9a9ea6]",
              )}
            />
            <span className="text-pretty">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
