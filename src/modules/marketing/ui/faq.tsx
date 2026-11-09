import { Plus } from "lucide-react";

export type FaqItem = { q: string; a: string };

export const PRODUCT_FAQ: FaqItem[] = [
  {
    q: "Do my clients need to sign up?",
    a: "No. They get a link, usually on WhatsApp. It opens in the browser, shows the request and the price, and they tap Approve, add their name and email, and confirm. Nothing to install, no password.",
  },
  {
    q: "Does my client's money go through ScopeLock?",
    a: "No. Clients pay you directly through your UPI ID, QR code, bank account or payment link. ScopeLock records what was paid and when. We never hold your money.",
  },
  {
    q: "What if my client says no to a change?",
    a: "Then you don't do that work, and the record shows they declined it. You can adjust the price or the scope and send it again. Either way, nobody is arguing about it three weeks later.",
  },
  {
    q: "I bill in milestones, like 30/30/40. Does that work?",
    a: "Yes. Set up your milestones once. When a change is approved, add it to the next milestone, the final payment, split it across the remaining ones, or ask for it upfront.",
  },
  {
    q: "Does this replace my contract?",
    a: "No. For bigger projects, keep a written contract too. ScopeLock is where everything after the contract lives: the agreed deliverables, every change, every approval and every payment, with dates and times.",
  },
  {
    q: "Can I try it before paying?",
    a: "Yes. The Free plan covers 2 active projects with no card needed. Upgrade when you need more projects or want your own logo on client pages.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. Cancel from Settings and your plan stays active until the end of the month you've paid for. Your projects and records stay available to download.",
  },
  {
    q: "Where is my data stored?",
    a: "On MongoDB Atlas cloud servers, encrypted at rest. Approval links are long random codes that you can revoke at any time. We don't sell or share your data.",
  },
];

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y border-y">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-[16.5px] font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
            {item.q}
            <Plus
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45"
              aria-hidden
            />
          </summary>
          <p className="max-w-[68ch] pb-6 text-[15.5px] leading-relaxed text-pretty text-muted-foreground">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
