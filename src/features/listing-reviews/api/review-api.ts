// The calls of the room reviews block (api-for-frontend.md, 6.41 and 6.20), one function each. They
// take the client and, for a read, the `signal` TanStack hands a `queryFn`, so a call that is left
// behind is cancelled. `listingId` is the UUID `id` of the listing detail: the review calls answer
// 400 `INVALID_ID` to a `slug-code` or a `code`. Nothing here logs, stores or sends the text of a
// comment anywhere but the request body (spec 0014, AC-21).

import type { ApiClient } from "@/lib/api/client";
import type {
  CreateReviewBody,
  ListingDetail,
  MyReview,
  MyReviewState,
  Page,
  PublicReview,
  UpdateReviewBody,
} from "@/lib/api/types";
import { REVIEWS_PAGE_SIZE } from "@/features/reviews/review-list";

const enc = encodeURIComponent;

/**
 * `GET /listings/:id/reviews`: the visible reviews of one room, newest first. The login is
 * optional: with a token each row carries `isMine`, without one it is `null`, and it is never a 401.
 */
export const getListingReviews = (
  api: ApiClient,
  listingId: string,
  page: number,
  signal?: AbortSignal,
) =>
  api.get<Page<PublicReview>>(`/listings/${enc(listingId)}/reviews`, {
    query: { page, pageSize: REVIEWS_PAGE_SIZE },
    auth: "optional",
    signal,
  });

/** `GET /listings/:id/review` (`review:read`, renters only): my review and whether I may write one. */
export const getMyListingReview = (
  api: ApiClient,
  listingId: string,
  signal?: AbortSignal,
) =>
  api.get<MyReviewState>(`/listings/${enc(listingId)}/review`, {
    auth: "required",
    signal,
  });

/** `POST /listings/:id/review` (`review:create`), 201. A create call: it is never sent twice by itself. */
export const createListingReview = (
  api: ApiClient,
  listingId: string,
  body: CreateReviewBody,
) => api.post<MyReview>(`/listings/${enc(listingId)}/review`, body);

/** `PATCH /listings/:id/review` (`review:update`): the body is never empty. */
export const updateListingReview = (
  api: ApiClient,
  listingId: string,
  body: UpdateReviewBody,
) => api.patch<MyReview>(`/listings/${enc(listingId)}/review`, body);

/** `DELETE /listings/:id/review` (`review:delete`), 204. */
export const deleteListingReview = (api: ApiClient, listingId: string) =>
  api.delete<void>(`/listings/${enc(listingId)}/review`);

/** The two numbers of a room (spec 0014, AC-4). */
export interface ListingSummary {
  reviewCount: number;
  ratingAverage: number | null;
}

/**
 * `GET /listings/:code` as a guest, kept to the two numbers the block shows. The server already
 * read the same detail without a token, so the browser asks the same way: the numbers are the
 * same for everyone, and no token goes with it.
 */
export async function getListingSummary(
  api: ApiClient,
  code: string,
  signal?: AbortSignal,
): Promise<ListingSummary> {
  const detail = await api.get<ListingDetail>(`/listings/${enc(code)}`, {
    auth: "none",
    signal,
  });
  return {
    reviewCount: detail.reviewCount,
    ratingAverage: detail.ratingAverage,
  };
}
