import type { Minor } from "@/shared/lib/money";
import type { ReportRow } from "./recovered-report";

/**
 * CSV for a spreadsheet or an accountant. Cells are quoted when needed, and
 * a cell that a spreadsheet would run as a formula (=, +, -, @) is prefixed
 * with ' so a client's title can't become one.
 */
export function toCsv(rows: readonly (readonly (string | number)[])[]): string {
  return rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

function cell(value: string | number): string {
  if (typeof value === "number") return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** 4700000 → "47000.00": plain numbers a spreadsheet can add up. */
export function plainAmount(amount: Minor): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export const RECOVERED_CSV_HEADER = [
  "Approved on",
  "Change request",
  "Title",
  "Project",
  "Client",
  "Currency",
  "Amount before GST",
  "Received",
  "Still to receive",
] as const;

/** Every change request approved in the year, oldest first. */
export function recoveredCsv(rows: readonly ReportRow[]): string {
  return toCsv([
    RECOVERED_CSV_HEADER,
    ...rows.map((r) => [
      r.approvedOn,
      r.label,
      r.title,
      r.projectName,
      r.clientName,
      r.currency,
      plainAmount(r.amount),
      plainAmount(r.received),
      plainAmount(r.outstanding),
    ]),
  ]);
}
