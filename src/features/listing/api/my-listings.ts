import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { OwnerListingSummary, Page } from "@/lib/api/types";
import type { ListingFilter } from "../listing-filter";

/** Ten rows a page, the same on the table and on the phone (spec 0019, AC-1). */
export const MY_LISTINGS_PAGE_SIZE = 10;

/**
 * The cache key all the pages of "Tin của tôi" live under. It sits next to `ownerListingKey`
 * (`["listing", "mine", id]`) and never meets it: the third part is the word "list".
 */
export const myListingsKey = ["listing", "mine", "list"] as const;

/** Which page of which filter the address asks for. */
export interface MyListingsParams {
  filter: ListingFilter;
  page: number;
}

export const myListingsPageKey = ({ filter, page }: MyListingsParams) =>
  [
    ...myListingsKey,
    { status: filter, page, pageSize: MY_LISTINGS_PAGE_SIZE },
  ] as const;

/**
 * `GET /me/listings` (api-for-frontend.md, 6.18): my listings in every status, newest first.
 * "Tất cả" sends no `status`.
 */
export const fetchMyListings = (
  api: ApiClient,
  { filter, page }: MyListingsParams,
  signal?: AbortSignal,
) =>
  api.get<Page<OwnerListingSummary>>("/me/listings", {
    query: {
      page,
      pageSize: MY_LISTINGS_PAGE_SIZE,
      ...(filter === "all" ? {} : { status: filter }),
    },
    signal,
  });

/**
 * One page of the list. The previous page stays on screen while the next one loads, but only
 * inside the same filter: rows of another filter under a new highlighted link would be a lie.
 */
export const myListingsQuery = (api: ApiClient, params: MyListingsParams) =>
  queryOptions({
    queryKey: myListingsPageKey(params),
    queryFn: ({ signal }) => fetchMyListings(api, params, signal),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[3].status === params.filter
        ? previous
        : undefined,
  });
