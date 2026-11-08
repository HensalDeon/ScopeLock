import type { ReactNode } from "react";
import type { InvoiceParty } from "../domain/snapshot";

export function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-medium tracking-[0.16em] text-[#6b6f78] uppercase">
      {children}
    </p>
  );
}

/** "From" or "Billed to": name, address and tax details. */
export function Party({
  label,
  party,
}: {
  label: string;
  party: InvoiceParty;
}) {
  return (
    <div className="grid content-start gap-1.5">
      <Label>{label}</Label>
      <div className="grid gap-0.5 text-[0.9rem] leading-snug">
        <p className="font-semibold">{party.company ?? party.name}</p>
        {party.company && <p>{party.name}</p>}
        {party.address && (
          <p className="whitespace-pre-line text-[#3a3d44]">{party.address}</p>
        )}
        {party.state && <p className="text-[#3a3d44]">State: {party.state}</p>}
        {party.country && <p className="text-[#3a3d44]">{party.country}</p>}
        {party.gstin && (
          <p className="font-mono text-[0.85rem] tabular-nums">
            GSTIN {party.gstin}
          </p>
        )}
        {party.email && <p className="text-[#3a3d44]">{party.email}</p>}
      </div>
    </div>
  );
}
