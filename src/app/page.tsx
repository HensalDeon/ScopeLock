import { site } from "@/shared/config/site";
import { Logo } from "@/shared/ui/brand";
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

      <Button size="lg" disabled>
        Coming soon
      </Button>
    </main>
  );
}
