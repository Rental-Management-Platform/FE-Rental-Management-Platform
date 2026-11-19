import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { AdminReview, Page, Uuid } from "@/lib/api/types";
import { sameFilters, type LandlordFilters } from "../review-filter";
import { adminLandlordReviewsListKey } from "./admin-reviews-keys";

/** Twenty rows a page: the API default (it allows 50 at most). */
export const ADMIN_REVIEWS_PAGE_SIZE = 20;

/** Which page of which filters the address asks for on the landlord tab. */
export type LandlordReviewsParams = LandlordFilters & { page: number };

/**
 * `GET /moderation/reviews` (`review:moderate`, api-for-frontend.md 6.40): the reviews of every
 * landlord in every state, the hidden ones and those of a writer who is locked included, newest
 * first. Only a filter that is set is sent: the API refuses a value outside its list. The rows keep
 * the order the API gave.
 */
export const fetchLandlordReviews = (
  api: ApiClient,
  params: LandlordReviewsParams,
  signal?: AbortSignal,
) =>
  api.get<Page<AdminReview>>("/moderation/reviews", {
    query: {
      page: params.page,
      pageSize: ADMIN_REVIEWS_PAGE_SIZE,
      ...(params.status === "all" ? {} : { status: params.status }),
      ...(params.landlordId === null ? {} : { landlordId: params.landlordId }),
      ...(params.authorId === null ? {} : { authorId: params.authorId }),
    },
    signal,
  });

/**
 * One page of the landlord reviews. The previous page stays on screen while the next one loads,
 * but only when the filters are the same: rows of other filters under a changed filter would be a
 * lie. The default `staleTime` of 0 is on purpose: a review written or deleted since shows up when
 * the page opens or the window gets focus.
 */
export const adminLandlordReviewsQuery = (
  api: ApiClient,
  params: LandlordReviewsParams,
) =>
  queryOptions({
    queryKey: adminLandlordReviewsListKey({
      ...params,
      pageSize: ADMIN_REVIEWS_PAGE_SIZE,
    }),
    queryFn: ({ signal }) => fetchLandlordReviews(api, params, signal),
    placeholderData: (previous, previousQuery) =>
      previousQuery !== undefined &&
      sameFilters(previousQuery.queryKey[4], params)
        ? previous
        : undefined,
  });

/**
 * `POST /moderation/reviews/:id/hide` (`review:moderate`, 6.40): a `visible` review becomes
 * `hidden_by_admin` and leaves the public list and the two numbers of the landlord at once. `:id` is
 * the id of the review (from this list), not of the landlord. The body is only the reason (1 to 500
 * characters). The answer is the whole moderation row after the change.
 */
export const hideLandlordReview = (api: ApiClient, id: Uuid, reason: string) =>
  api.post<AdminReview>(`/moderation/reviews/${encodeURIComponent(id)}/hide`, {
    reason,
  });

/**
 * `POST /moderation/reviews/:id/unhide` (`review:moderate`, 6.40): a `hidden_by_admin` review
 * becomes `visible` straight away, not a state that waits for the writer (a review has no step
 * between). Same body and same answer as a hide.
 */
export const unhideLandlordReview = (
  api: ApiClient,
  id: Uuid,
  reason: string,
) =>
  api.post<AdminReview>(
    `/moderation/reviews/${encodeURIComponent(id)}/unhide`,
    { reason },
  );
