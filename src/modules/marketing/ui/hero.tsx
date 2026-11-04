import { Check } from "lucide-react";
import Link from "next/link";
import { formatINR, paise } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { GridBackdrop } from "./grid-backdrop";
import { Container } from "./primitives";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <GridBackdrop />
      <Container className="relative grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:py-24">
        <div className="grid content-start gap-7">
          <p className="w-fit rounded-full border bg-canvas px-3 py-1 text-[13px] text-muted-foreground">
            For freelancers and agencies in India
          </p>
          <h1 className="text-[40px] leading-[1.02] font-semibold tracking-[-0.045em] text-balance sm:text-[56px] lg:text-[62px]">
            How much extra work did you do last month without charging?
          </h1>
          <p className="max-w-[54ch] text-[18px] leading-relaxed text-pretty text-muted-foreground">
            ScopeLock records what your client agreed to, turns every &ldquo;can
            you just add…&rdquo; into a priced change request, and gets it
            approved before you start the work.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11 px-5 text-[15px]">
              <Link href="/sign-up">Start free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-5 text-[15px]"
            >
              <Link href="/#how-it-works">See how it works</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Free for 2 projects. No card needed.
          </p>
        </div>

        <HeroExchange />
      </Container>
    </section>
  );
}

/**
 * The product in one story: a WhatsApp message becomes a priced change
 * request, and the client approves it. Times run down the left like a log.
 */
function HeroExchange() {
  return (
    <figure
      aria-label="A client's WhatsApp request turned into an approved change request"
      className="relative"
    >
      <ol className="relative grid gap-5">
        <span
          aria-hidden
          className="absolute top-3 bottom-3 left-[3.35rem] w-px bg-border sm:left-[3.85rem]"
        />

        <Step time="3:12 pm" label="Rahul on WhatsApp">
          <div className="max-w-[22rem] rounded-2xl rounded-tl-sm border bg-canvas px-4 py-3 text-[15px] leading-snug">
            Hey, can you also add a blog section? Should be quick.
          </div>
        </Step>

        <Step time="3:13 pm" label="You, in ScopeLock" accent>
          <div className="rounded-xl border bg-background shadow-[0_1px_2px_rgba(11,18,32,0.04),0_16px_40px_-18px_rgba(11,18,32,0.18)]">
            <div className="flex items-baseline justify-between gap-4 border-b px-4 py-3">
              <p className="text-[15px] font-medium">
                <span className="mr-2 font-mono text-[11.5px] text-muted-foreground">
                  CR-004
                </span>
                Blog section
              </p>
              <p className="text-[15px] font-semibold tabular-nums">
                {formatINR(paise(1_200_000))}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 text-[13px]">
              <dt className="text-muted-foreground">Original scope</dt>
              <dd>5 pages, no blog</dd>
              <dt className="text-muted-foreground">Billed with</dt>
              <dd>Final milestone</dd>
            </dl>
            <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5 text-[13px]">
              <span className="text-muted-foreground">Sent to Rahul</span>
              <span className="inline-flex items-center gap-1.5 text-warning">
                <span className="size-1.5 rounded-full bg-amber-500" />
                Waiting for approval
              </span>
            </div>
          </div>
        </Step>

        <Step time="3:42 pm" label="Rahul tapped Approve">
          <div className="flex items-center gap-3 rounded-xl border border-brand/30 bg-success-soft px-4 py-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <Check className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 text-[14px] leading-snug">
              <p className="font-medium">Approved by Rahul Mehta</p>
              <p className="text-muted-foreground">
                Project value{" "}
                <span className="tabular-nums">
                  {formatINR(paise(8_000_000))}
                </span>{" "}
                →{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatINR(paise(9_200_000))}
                </span>
              </p>
            </div>
          </div>
        </Step>
      </ol>
    </figure>
  );
}

function Step({
  time,
  label,
  accent = false,
  children,
}: {
  time: string;
  label: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="relative grid grid-cols-[2.9rem_minmax(0,1fr)] gap-4 sm:grid-cols-[3.4rem_minmax(0,1fr)]">
      <div className="relative pt-1 text-right">
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {time}
        </span>
        <span
          aria-hidden
          className={cn(
            "absolute top-[0.55rem] -right-[0.6rem] size-2 rounded-full border-2 border-background ring-1 sm:-right-[0.62rem]",
            accent ? "bg-foreground ring-foreground" : "bg-border ring-border",
          )}
        />
      </div>
      <div className="grid min-w-0 gap-2">
        <p className="text-[12.5px] text-muted-foreground">{label}</p>
        {children}
      </div>
    </li>
  );
}
