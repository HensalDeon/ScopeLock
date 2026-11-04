import { formatINR, paise } from "@/shared/lib/money";
import { LogoMark } from "@/shared/ui/brand";

type Change = {
  ref: string;
  title: string;
  note: string;
  amount: number;
  state: "approved" | "waiting";
};

const changes: Change[] = [
  {
    ref: "CR-001",
    title: "Blog section",
    note: "Approved by Rahul · 18 Nov, 3:42 pm",
    amount: 1_200_000,
    state: "approved",
  },
  {
    ref: "CR-002",
    title: "WhatsApp chat button",
    note: "Approved by Rahul · 18 Nov, 3:42 pm",
    amount: 300_000,
    state: "approved",
  },
  {
    ref: "CR-003",
    title: "Razorpay checkout",
    note: "Sent 21 Nov · waiting for Rahul",
    amount: 1_800_000,
    state: "waiting",
  },
];

const original = 8_000_000;
const approved = changes
  .filter((c) => c.state === "approved")
  .reduce((sum, c) => sum + c.amount, 0);

/**
 * The right-hand panel on auth screens: a real-looking change-order ledger,
 * so the product explains itself instead of a slogan doing it.
 */
export function LedgerShowcase() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-ink px-10 py-10 text-[#e8ecf2] lg:flex xl:px-14 xl:py-12">
      <p className="font-mono text-[11px] tracking-[0.12em] text-[#8b95a7] uppercase">
        Project ledger · Mehta Interiors
      </p>

      <div className="mx-auto w-full max-w-[26rem] py-10">
        <div className="rounded-xl border border-white/[0.08] bg-[#111a2c] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]">
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
            <div className="min-w-0">
              <p className="font-medium text-white">Website redesign</p>
              <p className="mt-0.5 text-[13px] text-[#8b95a7]">
                Rahul Mehta · 5-page site
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-bright/25 bg-brand-bright/10 px-2 py-0.5 text-[11px] font-medium text-brand-bright">
              <LogoMark title="" className="size-3 text-brand-bright" />
              Scope locked
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
            <div className="min-w-0">
              <p className="text-sm text-white">Original agreement</p>
              <p className="text-[12px] text-[#8b95a7]">Approved 04 Nov</p>
            </div>
            <p className="text-sm text-white tabular-nums">
              {formatINR(paise(original))}
            </p>
          </div>

          <p className="border-t border-white/[0.07] px-5 pt-3 pb-1 font-mono text-[10.5px] tracking-[0.12em] text-[#8b95a7] uppercase">
            Changes
          </p>
          <ul className="px-5 pb-2">
            {changes.map((c) => (
              <li
                key={c.ref}
                className="flex items-baseline justify-between gap-4 py-2.5"
              >
                <div className="flex min-w-0 gap-2.5">
                  <span
                    aria-hidden
                    className={
                      c.state === "approved"
                        ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-bright"
                        : "mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400"
                    }
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-white">
                      <span className="mr-1.5 font-mono text-[11px] text-[#8b95a7]">
                        {c.ref}
                      </span>
                      {c.title}
                    </p>
                    <p
                      className={
                        c.state === "approved"
                          ? "text-[12px] text-[#8b95a7]"
                          : "text-[12px] text-amber-300/90"
                      }
                    >
                      {c.note}
                    </p>
                  </div>
                </div>
                <p
                  className={
                    c.state === "approved"
                      ? "text-sm text-white tabular-nums"
                      : "text-sm text-[#8b95a7] tabular-nums"
                  }
                >
                  +{formatINR(paise(c.amount))}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex items-end justify-between gap-4 rounded-b-xl border-t border-white/[0.07] bg-white/[0.02] px-5 py-4">
            <div>
              <p className="text-[12px] text-[#8b95a7]">Project value now</p>
              <p className="mt-0.5 text-[26px] leading-none font-semibold tracking-tight text-white tabular-nums">
                {formatINR(paise(original + approved))}
              </p>
            </div>
            <p className="text-right text-[12px] text-brand-bright">
              +{formatINR(paise(approved))} recovered
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[26rem]">
        <p className="text-[22px] leading-snug font-medium tracking-tight text-balance text-white">
          Every extra request gets a price and a yes before you build it.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#8b95a7]">
          The original deal, every change, every approval and every payment, in
          one place your client can see.
        </p>
      </div>
    </div>
  );
}
