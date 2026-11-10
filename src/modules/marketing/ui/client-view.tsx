import { LogoMark } from "@/shared/ui/brand";
import { rupees, STORY, storyTotal } from "../domain/story";
import { Leader } from "./primitives";

/**
 * What Rahul sees when he opens the link from WhatsApp, at phone size, and
 * what happens the moment he taps Approve.
 */
export function ClientApproval() {
  const c = STORY.change;
  return (
    <div className="grid items-start gap-10 sm:grid-cols-[19.5rem_minmax(0,1fr)] sm:gap-12">
      <PhoneApproval />
      <ol className="grid gap-0 sm:pt-16">
        {[
          [
            c.approvedAt,
            `${STORY.clientFirst} taps Approve and types his name.`,
          ],
          [
            "Saved",
            "The exact page he saw, his name and email, the time, his device. Signed, so it can't be edited later.",
          ],
          [
            "To you",
            `An email: ${STORY.client} approved ${c.label}. The project total is now ${rupees(storyTotal())}.`,
          ],
          [
            "Payment",
            `${rupees(c.amount)} joins the “${c.billedWith}” payment, as the change order said.`,
          ],
        ].map(([when, what]) => (
          <li
            key={when}
            className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-4 border-b py-4 first:border-t"
          >
            <span className="pt-0.5 font-mono text-[12px] text-muted-foreground tabular-nums">
              {when}
            </span>
            <span className="text-[15px] leading-relaxed text-pretty">
              {what}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PhoneApproval() {
  const c = STORY.change;
  return (
    <div
      role="img"
      aria-label={`The approval page ${STORY.client} sees on his phone: ${c.label}, ${c.title}, ${rupees(c.amount)}, with Approve and Decline buttons`}
      className="mx-auto w-full max-w-[19.5rem] rounded-[2.6rem] border bg-canvas p-2.5"
    >
      <div
        aria-hidden
        className="overflow-hidden rounded-[2.1rem] border bg-background"
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <span className="h-1.5 w-16 rounded-full bg-border" />
        </div>
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-md bg-brand-ink text-[12px] font-semibold text-white">
            AM
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium">{STORY.studio}</p>
            <p className="truncate text-[12px] text-muted-foreground">
              {STORY.project} · {STORY.company}
            </p>
          </div>
        </div>
        <div className="grid gap-4 px-5 py-5">
          <div className="grid gap-1">
            <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
              Change request {c.label}
            </p>
            <p className="text-[19px] leading-snug font-semibold tracking-tight">
              {c.title}
            </p>
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {c.detail} Not part of the 5-page website you approved on{" "}
            {STORY.agreedOn}.
          </p>
          <dl className="grid gap-2 rounded-lg bg-canvas p-3 text-[13px]">
            <div className="flex items-baseline">
              <dt className="text-muted-foreground">Price</dt>
              <Leader />
              <dd className="font-semibold tabular-nums">{rupees(c.amount)}</dd>
            </div>
            <div className="flex items-baseline">
              <dt className="text-muted-foreground">Billed with</dt>
              <Leader />
              <dd>{c.billedWith}</dd>
            </div>
            <div className="flex items-baseline">
              <dt className="text-muted-foreground">Project total after</dt>
              <Leader />
              <dd className="tabular-nums">{rupees(storyTotal())}</dd>
            </div>
          </dl>
          <div className="grid gap-2">
            <span className="flex h-11 items-center justify-center rounded-lg bg-primary text-[14px] font-medium text-primary-foreground">
              Approve {rupees(c.amount)}
            </span>
            <span className="flex h-11 items-center justify-center rounded-lg border text-[14px] font-medium">
              Decline
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 border-t bg-canvas py-2.5 text-[11px] text-muted-foreground">
          Sent with
          <LogoMark title="" className="size-3" />
          <span className="font-medium tracking-tight text-foreground">
            scopelock
          </span>
        </div>
      </div>
    </div>
  );
}
