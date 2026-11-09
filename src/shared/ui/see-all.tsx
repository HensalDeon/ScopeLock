import type { Route } from "next";
import Link from "next/link";

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
      className="text-sm font-medium underline-offset-4 hover:underline"
    >
      See all {total}
    </Link>
  );
}
