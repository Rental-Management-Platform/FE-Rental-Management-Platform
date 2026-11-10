import { cache } from "react";
import { serverGet } from "@/lib/api/server";
import type { Page, PublicListingSummary } from "@/lib/api/types";
import {
  LISTING_PAGE_SIZE,
  type ListingSearch,
} from "../schemas/search-params";

/**
 * The query of one page of the list (spec 0016, AC-3). A value that is not set is left out (`""`,
 * `null`, and `sort` when it is `newest`), so it is never sent: the API answers the same rows
 * for "no filter" and for the default. A `maxPrice` of 0 is a limit and is sent. The overlay of
 * #14 repeats the same call with the token, so both reads take it from here and always ask for
 * the same rows.
 */
export const listingsQuery = ({
  q,
  wardCode,
  minPrice,
  maxPrice,
  sort,
  page,
}: ListingSearch) => ({
  ...(q !== "" && { q }),
  ...(wardCode !== "" && { wardCode }),
  ...(minPrice !== null && { minPrice }),
  ...(maxPrice !== null && { maxPrice }),
  ...(sort !== "newest" && { sort }),
  page,
  pageSize: LISTING_PAGE_SIZE,
});

// `cache()` compares its arguments by identity, and a new object is never equal to the last one.
// So the cached function takes the six single values, and two calls with the same search share
// one request.
const readListings = cache(
  (
    q: string,
    wardCode: string,
    minPrice: number | null,
    maxPrice: number | null,
    sort: ListingSearch["sort"],
    page: number,
  ): Promise<Page<PublicListingSummary>> =>
    serverGet<Page<PublicListingSummary>>(
      "/listings",
      listingsQuery({ q, wardCode, minPrice, maxPrice, sort, page }),
    ),
);

/**
 * One page of public listings, read on the server as a guest (spec 0009, AC-5 and AC-14). `cache()`
 * only de-duplicates the calls of one render. It keeps nothing between visits.
 */
export const getListings = ({
  q,
  wardCode,
  minPrice,
  maxPrice,
  sort,
  page,
}: ListingSearch): Promise<Page<PublicListingSummary>> =>
  readListings(q, wardCode, minPrice, maxPrice, sort, page);
