// "/" matches only itself; any other item also owns the pages below it.
const owns = (pathname: string, href: string) =>
  href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);

// Only one item in a list is the current page: the one with the longest matching address. So a
// section link and a page inside it are never both marked `aria-current` (and never both teal).
export const currentHrefOf = (
  pathname: string,
  hrefs: readonly string[],
): string | null =>
  hrefs
    .filter((href) => owns(pathname, href))
    .reduce<string | null>(
      (best, href) =>
        best === null || href.length > best.length ? href : best,
      null,
    );
