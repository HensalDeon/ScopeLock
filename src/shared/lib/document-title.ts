/**
 * A document page's title, which the browser also uses as the saved PDF's
 * file name: "Tax invoice AD-26-27-010 · Asha Menon". Slashes (invoice
 * numbers) become hyphens, since file names can't hold them.
 */
export function documentTitle(...parts: (string | null | undefined)[]): string {
  return parts
    .filter((p): p is string => Boolean(p && p.trim()))
    .map((p) => p.trim().replace(/[\\/]/g, "-"))
    .join(" · ");
}
