import { formatDate, formatDateTime } from "@/shared/lib/dates";

/** The client's answer, printed on the document itself (not app chrome). */
export type DocumentAcceptance = {
  /** "Approved", "Declined", "Changes requested". */
  verdict: string;
  name: string;
  email: string | null;
  at: Date;
  /** What the client wrote with their answer (a reason to decline). */
  comment?: string | null;
  /** The signed record's fingerprint and whether it still matches. */
  record?: { hash: string; intact: boolean; checkedAt: Date } | null;
};

/**
 * Who answered, when, and (on the signed record) that the content still
 * matches what they saw. Part of the sheet, so a printed or saved PDF
 * carries the signature with it.
 */
export function AcceptanceBlock({
  acceptance: a,
}: {
  acceptance: DocumentAcceptance;
}) {
  // A record carries the full date, year included.
  const when = (d: Date) =>
    `${formatDate(d, { withYear: true })}, ${formatDateTime(d).split(", ").at(-1)}`;
  return (
    <section
      aria-label="Client's answer"
      className="grid [break-inside:avoid] gap-1 border-t-2 border-(--doc-accent) pt-4 text-[0.88rem] leading-relaxed text-[#1d1f24]"
    >
      <p className="text-[11px] font-semibold tracking-[0.14em] text-(--doc-soft-text) uppercase">
        {a.verdict}
      </p>
      <p>
        {a.verdict} by <strong className="font-semibold">{a.name}</strong>
        {a.email ? ` (${a.email})` : ""} on {when(a.at)} IST.
      </p>
      {a.comment && <p>Their note: “{a.comment}”</p>}
      {a.record && (
        <p className="text-xs text-[#565a63] tabular-nums">
          Checked {when(a.record.checkedAt)}:{" "}
          {a.record.intact
            ? "intact, this is exactly what they saw."
            : "it doesn't match. This content has changed since they answered."}
        </p>
      )}
      {a.record && (
        <p className="font-mono text-[11px] break-all text-[#6b6f78]">
          SHA-256 {a.record.hash}
        </p>
      )}
    </section>
  );
}
