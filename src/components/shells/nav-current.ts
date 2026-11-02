// "/" matches only itself; any other item also owns the pages below it, unless it is listed as
// exact (the "Tổng quan" item, which would otherwise own every page of its area).
const owns = (pathname: string, href: string, exact: boolean) =>
  exact || href === "/"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

// Only one item in a list is the current page: the one with the longest matching address. So a
// section link and a page inside it are never both marked `aria-current` (and never both teal).
// `exactHrefs` names the items that are current on their own address only (spec 0008, AC-12).
export const currentHrefOf = (
  pathname: string,
  hrefs: readonly string[],
  exactHrefs: readonly string[] = [],
): string | null =>
  hrefs
    .filter((href) => owns(pathname, href, exactHrefs.includes(href)))
    .reduce<string | null>(
      (best, href) =>
        best === null || href.length > best.length ? href : best,
      null,
    );
