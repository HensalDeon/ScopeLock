import Link from "next/link";
import { legal, site } from "@/shared/config/site";
import { Logo } from "@/shared/ui/brand";
import { Button } from "@/shared/ui/button";
import { Container } from "./primitives";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label={`${site.name} home`} className="rounded-md">
          <Logo className="text-[19px]" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Sign in
          </Link>
          <Button asChild>
            <Link href="/sign-up">Start free</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
      { href: "/sign-in", label: "Sign in" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/refunds", label: "Refunds and cancellation" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t bg-canvas">
      <Container className="grid gap-10 py-14 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-3">
          <Logo className="text-lg" />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Scope, change requests, approvals and payments for freelancers and
            agencies. Made in India.
          </p>
        </div>
        {FOOTER_LINKS.map((group) => (
          <div key={group.title} className="grid content-start gap-3">
            <p className="text-sm font-medium">{group.title}</p>
            <ul className="grid gap-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <Container className="flex flex-wrap items-center justify-between gap-3 border-t py-6 text-[13px] text-muted-foreground">
        <p>
          © {legal.copyrightYear} {legal.businessName}
        </p>
        <p>Prices in Indian rupees. GST extra where applicable.</p>
      </Container>
    </footer>
  );
}
