import type { ListingSearch } from "./schemas/search-params";

// Questions about a cleaned search state, asked by the results, the metadata and later the bar.
// Pure functions, so each can be checked by calling it with a state.

/** The ward or a price limit is on. The order and the keyword are not filters (spec 0016). */
export const hasFilters = ({
  wardCode,
  minPrice,
  maxPrice,
}: ListingSearch): boolean =>
  wardCode !== "" || minPrice !== null || maxPrice !== null;

/** A keyword is set. */
export const hasKeyword = ({ q }: ListingSearch): boolean => q !== "";

/**
 * Both limits are set and the lower one is above the upper one. This is the one state the API
 * would answer 400 to, so the page never sends it (spec 0016, AC-4). It is only reached by a
 * hand typed address or an old link: the form stops it first.
 */
export const isReversedRange = ({
  minPrice,
  maxPrice,
}: ListingSearch): boolean =>
  minPrice !== null && maxPrice !== null && minPrice > maxPrice;

/**
 * The plain list: no keyword, no filter and the default order. Only this one (with any page
 * number) is indexed, because every other state costs an API call of its own (spec 0016, AC-16).
 */
export const isPlainList = (search: ListingSearch): boolean =>
  !hasKeyword(search) && !hasFilters(search) && search.sort === "newest";
