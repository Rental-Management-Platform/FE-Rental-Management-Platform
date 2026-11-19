import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type {
  AdminListingReview,
  AdminReview,
  Page,
  Uuid,
} from "@/lib/api/types";
import {
  sameFilters,
  type LandlordFilters,
  type ListingFilters,
} from "../review-filter";
import {
  adminLandlordReviewsListKey,
  adminListingReviewsListKey,
} from "./admin-reviews-keys";

/** Twenty rows a page: the API default (it allows 50 at most). */
export const ADMIN_REVIEWS_PAGE_SIZE = 20;

/** Which page of which filters the address asks for on the landlord tab. */
export type LandlordReviewsParams = LandlordFilters & { page: number };

/** The same for the room tab. */
export type ListingReviewsParams = ListingFilters & { page: number };

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

/**
 * `GET /moderation/listing-reviews` (`review:moderate`, 6.41): the reviews of every room in every
 * state, the hidden ones, those of a listing that is hidden or deleted and those of a writer who is
 * locked included, newest first. Only a filter that is set is sent. `landlordId` is never sent: it is
 * the filter of the other list and this one answers it with 400.
 */
export const fetchListingReviews = (
  api: ApiClient,
  params: ListingReviewsParams,
  signal?: AbortSignal,
) =>
  api.get<Page<AdminListingReview>>("/moderation/listing-reviews", {
    query: {
      page: params.page,
      pageSize: ADMIN_REVIEWS_PAGE_SIZE,
      ...(params.status === "all" ? {} : { status: params.status }),
      ...(params.listingId === null ? {} : { listingId: params.listingId }),
      ...(params.authorId === null ? {} : { authorId: params.authorId }),
    },
    signal,
  });

/**
 * One page of the room reviews, under its own keys (the ids of the two kinds come from different
 * tables). Kept the same way as the landlord list: the previous page stays while the next loads only
 * when the filters are the same, and `staleTime` stays 0.
 */
export const adminListingReviewsQuery = (
  api: ApiClient,
  params: ListingReviewsParams,
) =>
  queryOptions({
    queryKey: adminListingReviewsListKey({
      ...params,
      pageSize: ADMIN_REVIEWS_PAGE_SIZE,
    }),
    queryFn: ({ signal }) => fetchListingReviews(api, params, signal),
    placeholderData: (previous, previousQuery) =>
      previousQuery !== undefined &&
      sameFilters(previousQuery.queryKey[4], params)
        ? previous
        : undefined,
  });

/**
 * `POST /moderation/listing-reviews/:id/hide` (`review:moderate`, 6.41): a `visible` review becomes
 * `hidden_by_admin`. `:id` is the id of the REVIEW (from this list), not the UUID of the listing as
 * in the four routes of the writer. The listing may be hidden or deleted: this does not look. Same
 * body and same answer as the landlord review.
 */
export const hideListingReview = (api: ApiClient, id: Uuid, reason: string) =>
  api.post<AdminListingReview>(
    `/moderation/listing-reviews/${encodeURIComponent(id)}/hide`,
    { reason },
  );

/**
 * `POST /moderation/listing-reviews/:id/unhide` (`review:moderate`, 6.41): a `hidden_by_admin` review
 * becomes `visible` straight away, even when its listing is hidden. Same body and same answer.
 */
export const unhideListingReview = (api: ApiClient, id: Uuid, reason: string) =>
  api.post<AdminListingReview>(
    `/moderation/listing-reviews/${encodeURIComponent(id)}/unhide`,
    { reason },
  );
