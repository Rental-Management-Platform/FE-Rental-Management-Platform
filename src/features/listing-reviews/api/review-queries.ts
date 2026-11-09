import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { Page, PublicReview } from "@/lib/api/types";
import {
  getListingReviews,
  getListingSummary,
  getMyListingReview,
} from "./review-api";
import { listingReviewKeys, type Viewer } from "./review-keys";

/** How long a page of the list counts as fresh (spec 0014, AC-6). */
export const LIST_STALE_MS = 30_000;

/**
 * One page of the public list of a room, as `viewer` sees it. The page before stays on screen
 * while the next one loads, but only when it was read for the same viewer: after a sign in or out
 * the rows of the other viewer (with their `isMine`) must not be shown in place of the new ones.
 * The caller never runs it while the session is `loading`. The default retry (once) applies.
 */
export const listingReviewListQuery = (
  api: ApiClient,
  listingId: string,
  viewer: Viewer,
  page: number,
) =>
  queryOptions({
    queryKey: listingReviewKeys.list(listingId, viewer, page),
    queryFn: ({ signal }) => getListingReviews(api, listingId, page, signal),
    staleTime: LIST_STALE_MS,
    placeholderData: (
      previous: Page<PublicReview> | undefined,
      previousQuery,
    ) => (previousQuery?.queryKey[3] === viewer ? previous : undefined),
  });

/**
 * My own review of the room and whether I may write one. Only a `writer` runs it (spec 0014,
 * AC-5). It is the one truth for "have I reviewed" (a hidden review is not in the public list), and
 * the writes put their answer straight into it. It has no viewer in its key: the cache is emptied
 * when the session changes.
 */
export const myListingReviewQuery = (api: ApiClient, listingId: string) =>
  queryOptions({
    queryKey: listingReviewKeys.mine(listingId),
    queryFn: ({ signal }) => getMyListingReview(api, listingId, signal),
  });

/**
 * The two numbers under the heading (spec 0014, AC-4). The server read gives the first values
 * (`initialData`, passed by the hook), and the only thing that reads again is the invalidate after a
 * write: `staleTime` is `Infinity`, so there is no timer, no focus read and no mount read. `gcTime`
 * is 0, so a visit that the server renders starts from the numbers it just read and never from an
 * older entry. There is no `select`: `initialData` has the same shape the `queryFn` returns.
 */
export const listingSummaryQuery = (
  api: ApiClient,
  listingId: string,
  code: string,
) =>
  queryOptions({
    queryKey: listingReviewKeys.summary(listingId),
    queryFn: ({ signal }) => getListingSummary(api, code, signal),
    staleTime: Infinity,
    gcTime: 0,
  });
