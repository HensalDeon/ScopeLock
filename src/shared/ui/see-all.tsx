import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { TOUCH_LINK } from "@/shared/ui/touch";

/** "See all 18" beside a section that shows only the latest few. */
export function SeeAll({
  href,
  total,
  shown,
}: {
  href: string;
  total: number;
  shown: number;
}) {
  if (total <= shown) return null;
  return (
    <Link
      href={href as Route}
      className={cn(
        "text-sm font-medium underline-offset-4 hover:underline",
        TOUCH_LINK,
      )}
    >
      See all {total}
    </Link>
  );
}
