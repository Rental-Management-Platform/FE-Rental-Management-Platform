import { cache } from "react";
import { serverGet } from "@/lib/api/server";
import type { Page, PublicListingSummary } from "@/lib/api/types";
import { LISTING_PAGE_SIZE } from "../schemas/search-params";

/**
 * The query of one page of the list. The overlay of #14 repeats the same call with the token, so
 * both reads take it from here and always ask for the same rows.
 */
export const listingsQuery = (q: string, page: number) => ({
  q,
  page,
  pageSize: LISTING_PAGE_SIZE,
});

/**
 * One page of public listings, read on the server as a guest (spec 0009, AC-5 and AC-14).
 * `cache()` only de-duplicates the calls of one render. It keeps nothing between visits, and its
 * arguments are primitives so two calls with the same search share one request.
 */
export const getListings = cache(
  (q: string, page: number): Promise<Page<PublicListingSummary>> =>
    serverGet<Page<PublicListingSummary>>("/listings", listingsQuery(q, page)),
);
