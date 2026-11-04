import { site } from "@/shared/config/site";
import { Logo } from "@/shared/ui/brand";
import Link from "next/link";
import { Button } from "@/shared/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <Logo className="text-2xl" />

      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        How much extra work did you do last month without charging?
      </h1>

      <p className="max-w-prose text-lg text-pretty text-muted-foreground">
        {site.description}
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/sign-up">Create an account</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}
