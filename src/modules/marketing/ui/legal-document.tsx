import { legal } from "@/shared/config/site";
import { Container, DISPLAY } from "./primitives";

export type LegalSection = {
  id: string;
  title: string;
  body: React.ReactNode;
};

/**
 * Shared layout for Terms, Privacy and Refunds: numbered sections with a
 * table of contents (sticky on desktop). Section order is meaningful in a
 * legal document, so the numbers are real references, not decoration.
 */
export function LegalDocument({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <Container className="py-14 sm:py-20">
      {/* The rule runs the full width; only the text keeps its measure. */}
      <header className="grid gap-4 border-b pb-10">
        <h1
          className={`${DISPLAY} text-[38px] leading-[1] font-semibold sm:text-[50px]`}
        >
          {title}
        </h1>
        <div className="max-w-[68ch] text-[17px] leading-relaxed text-pretty text-muted-foreground">
          {intro}
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          Last updated {legal.lastUpdated}
        </p>
      </header>

      <div className="grid gap-12 pt-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <nav
          aria-label="On this page"
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <p className="mb-3 text-sm font-medium">On this page</p>
          <ol className="grid gap-1.5 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="w-5 shrink-0 tabular-nums">{i + 1}.</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid max-w-[70ch] gap-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="mb-3 flex gap-3 text-xl font-semibold tracking-[-0.015em]">
                <span className="text-muted-foreground tabular-nums">
                  {i + 1}.
                </span>
                {s.title}
              </h2>
              <div className="legal-prose">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}

/** The business details block reused by the legal pages and Contact. */
export function BusinessDetails({
  compact = false,
}: {
  /** Leave out email and phone (Contact shows them already). */
  compact?: boolean;
}) {
  return (
    <dl className="grid gap-x-6 gap-y-2 rounded-lg border bg-canvas p-5 text-[15px] sm:grid-cols-[10rem_minmax(0,1fr)]">
      <dt className="text-muted-foreground">Business</dt>
      <dd>
        {legal.businessName} ({legal.businessType})
      </dd>
      <dt className="text-muted-foreground">Registered address</dt>
      <dd>{legal.address}</dd>
      {!compact && (
        <>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{legal.email}</dd>
          <dt className="text-muted-foreground">Phone</dt>
          <dd className="tabular-nums">{legal.phone}</dd>
        </>
      )}
      <dt className="text-muted-foreground">GSTIN</dt>
      <dd>{legal.gstin}</dd>
    </dl>
  );
}
