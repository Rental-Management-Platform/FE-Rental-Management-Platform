import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { Page, PublicReview } from "@/lib/api/types";
import { getMyReview, getReviews } from "./review-api";
import { reviewKeys, type Viewer } from "./review-keys";

/** How long a page of the list counts as fresh (spec 0013, AC-3). */
export const LIST_STALE_MS = 30_000;

/**
 * One page of the public list, as `viewer` sees it. The page before stays on screen while the next
 * one loads, but only when it was read for the same viewer: after a sign in or out the rows of the
 * other viewer (with their `isMine`) must not be shown in place of the new ones. The caller never
 * runs it while the session is `loading`. The default retry (once) applies.
 */
export const reviewListQuery = (
  api: ApiClient,
  landlordId: string,
  viewer: Viewer,
  page: number,
) =>
  queryOptions({
    queryKey: reviewKeys.list(landlordId, viewer, page),
    queryFn: ({ signal }) => getReviews(api, landlordId, page, signal),
    staleTime: LIST_STALE_MS,
    placeholderData: (
      previous: Page<PublicReview> | undefined,
      previousQuery,
    ) => (previousQuery?.queryKey[3] === viewer ? previous : undefined),
  });

/**
 * My own review and whether I may write one. Only a `writer` runs it (spec 0013, AC-2). It is the
 * one truth for "have I reviewed" (a hidden review is not in the public list), and the writes put
 * their answer straight into it. It has no viewer in its key: the cache is emptied when the session
 * changes.
 */
export const myReviewQuery = (api: ApiClient, landlordId: string) =>
  queryOptions({
    queryKey: reviewKeys.mine(landlordId),
    queryFn: ({ signal }) => getMyReview(api, landlordId, signal),
  });
