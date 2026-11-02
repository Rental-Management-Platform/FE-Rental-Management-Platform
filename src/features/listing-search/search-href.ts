import type { ListingSearch } from "./schemas/search-params";

/**
 * The address of a search state (spec 0009, AC-2). An empty `q` and a `page` of 1 are left out,
 * and `q` comes before `page`, so the plain list is `/`. The page links, the form, the canonical
 * address and the boundary key all use this one function.
 */
export function listingsHref({ q, page }: ListingSearch): string {
  const params = new URLSearchParams();
  if (q !== "") params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query === "" ? "/" : `/?${query}`;
}
