import { rupees, STORY, storyTotal } from "../domain/story";

/**
 * The project's payments as the app keeps them: each milestone, the change
 * that joined one, how it was paid and when it was confirmed.
 */
export function PaymentLedger() {
  return (
    <div className="grid gap-8">
      <div className="border-t border-foreground">
        <table className="w-full text-left text-[14px] sm:text-[15px]">
          <caption className="sr-only">
            Payments on the {STORY.company} website, with {STORY.change.label}{" "}
            added to the {STORY.change.billedWith} payment
          </caption>
          <thead>
            <tr className="border-b font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
              <th scope="col" className="py-2.5 pr-4 font-normal">
                Payment
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 font-normal md:table-cell"
              >
                Paid by
              </th>
              <th scope="col" className="py-2.5 pl-4 text-right font-normal">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {STORY.milestones.map((m) => (
              <tr key={m.name} className="border-b align-top">
                <td className="py-4 pr-4">
                  <p className="font-medium">
                    {m.name}{" "}
                    <span className="font-normal text-muted-foreground tabular-nums">
                      {m.percent}%
                    </span>
                  </p>
                  {m.extra > 0 && (
                    <p className="mt-1 text-[13px] text-muted-foreground tabular-nums">
                      {rupees(m.amount)} agreed +{" "}
                      <span className="whitespace-nowrap text-success-ink">
                        {rupees(m.extra)} {STORY.change.label}
                      </span>
                    </p>
                  )}
                  <p className="mt-1 text-[13px] text-muted-foreground md:hidden">
                    UPI · received {m.paidOn}
                  </p>
                </td>
                <td className="hidden px-3 py-4 text-[13px] text-muted-foreground md:table-cell">
                  <p>
                    UPI ·{" "}
                    {m.extra > 0 ? (
                      <span className="font-mono tabular-nums">
                        UTR {STORY.utr}
                      </span>
                    ) : (
                      "QR with the amount filled in"
                    )}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-brand" />
                    Received {m.paidOn}
                  </p>
                </td>
                <td className="py-4 pl-4 text-right font-semibold tabular-nums">
                  {rupees(m.amount + m.extra)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-canvas">
              <td className="py-4 pr-4" colSpan={1}>
                <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                  Total received
                </p>
              </td>
              <td className="hidden md:table-cell" />
              <td className="py-4 pl-4 text-right text-[22px] font-semibold tracking-[-0.02em] tabular-nums">
                {rupees(storyTotal())}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <ul className="grid gap-x-10 gap-y-4 text-[15px] leading-relaxed text-pretty md:grid-cols-3">
        {[
          "Your client's page shows a UPI QR with the amount filled in, your bank details or your payment link.",
          "They tap “I've paid” with the UTR and a screenshot. You check your bank and confirm.",
          "Money goes straight to you. ScopeLock never holds it.",
        ].map((line) => (
          <li key={line} className="border-t pt-4">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
