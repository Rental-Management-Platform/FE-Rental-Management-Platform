import type { ListingSearch, ListingSort } from "./schemas/search-params";

/**
 * The address of a search state (spec 0016, AC-2, which extends spec 0009, AC-2). Only a value
 * that is not the default is written, in the order `q`, `wardCode`, `minPrice`, `maxPrice`,
 * `sort`, `page`, so the plain list is `/`. The page links, the chips, the clear buttons, the sort
 * links, the canonical address and the boundary key all use this one function.
 */
export function listingsHref({
  q,
  wardCode,
  minPrice,
  maxPrice,
  sort,
  page,
}: ListingSearch): string {
  const params = new URLSearchParams();
  if (q !== "") params.set("q", q);
  if (wardCode !== "") params.set("wardCode", wardCode);
  if (minPrice !== null) params.set("minPrice", String(minPrice));
  if (maxPrice !== null) params.set("maxPrice", String(maxPrice));
  if (sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query === "" ? "/" : `/?${query}`;
}

// A change of what is searched always starts again at the first page. Only a page link keeps its
// own page number, and it builds that with a spread.

/** Drops the ward filter. */
export const withoutWard = (search: ListingSearch): ListingSearch => ({
  ...search,
  wardCode: "",
  page: 1,
});

/** Drops both price limits. */
export const withoutPrice = (search: ListingSearch): ListingSearch => ({
  ...search,
  minPrice: null,
  maxPrice: null,
  page: 1,
});

/** Drops the ward and the price, keeping the keyword and the order. */
export const withoutFilters = (search: ListingSearch): ListingSearch =>
  withoutPrice(withoutWard(search));

/** Drops the keyword, keeping the filters and the order. */
export const withoutKeyword = (search: ListingSearch): ListingSearch => ({
  ...search,
  q: "",
  page: 1,
});

/** Changes the order, keeping the keyword and the filters. */
export const withSort = (
  search: ListingSearch,
  sort: ListingSort,
): ListingSearch => ({ ...search, sort, page: 1 });
